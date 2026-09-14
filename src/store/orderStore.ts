import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { OrderStatus, PaymentStatus } from '@/types';

// ─── Shape ────────────────────────────────────────────────────────────────────

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface RealOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  gatewaySessionId?: string;
  couponCode?: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
}

// ─── Row ↔ Domain mappers ─────────────────────────────────────────────────────

function rowToOrder(row: any): RealOrder {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number ?? row.id),
    status: (row.status as OrderStatus) ?? 'pending',
    paymentStatus: (row.payment_status as PaymentStatus) ?? 'pending',
    paymentMethod: String(row.payment_method ?? ''),
    transactionId: row.transaction_id ?? undefined,
    gatewaySessionId: row.gateway_session_id ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    shippingCharge: Number(row.shipping_charge ?? 0),
    total: Number(row.total ?? 0),
    notes: row.notes ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    customer: {
      firstName: String(row.customer_first_name ?? ''),
      lastName: String(row.customer_last_name ?? ''),
      email: String(row.customer_email ?? ''),
      phone: String(row.customer_phone ?? ''),
      address: String(row.customer_address ?? ''),
      city: String(row.customer_city ?? ''),
      district: row.customer_district ?? undefined,
    },
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function orderToRow(order: RealOrder): Record<string, unknown> {
  return {
    id: undefined,
    order_number: order.orderNumber,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    transaction_id: order.transactionId ?? null,
    gateway_session_id: order.gatewaySessionId ?? null,
    coupon_code: order.couponCode ?? null,
    subtotal: order.subtotal,
    discount: order.discount,
    // Persist the delivery charge — the admin snapshots previously had to
    // recover it arithmetically because every live row shipped null here.
    shipping_charge: order.shippingCharge ?? null,
    total: order.total,
    notes: order.notes ?? null,
    customer_first_name: order.customer.firstName,
    customer_last_name: order.customer.lastName,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    customer_address: order.customer.address,
    customer_city: order.customer.city,
    customer_district: order.customer.district ?? null,
    items: order.items,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface OrderStore {
  orders: RealOrder[];
  loading: boolean;
  hasFetched: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  placeOrder: (order: RealOrder) => Promise<RealOrder>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
  updateOrder: (order: RealOrder) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  loading: false,
  hasFetched: false,
  error: null,

  // ── Fetch all orders (admin only, via the service-role API route) ─────────
  fetchOrders: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      // Migration 009 removed the public SELECT on `orders` (PII leak), so
      // the anon client can't read the table anymore. Admin panels go
      // through /api/admin-orders, which verifies the caller server-side.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sign in as an admin to load orders.');

      const res = await fetch('/api/admin-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load orders');
      }
      const body = await res.json();
      const rows: unknown[] = Array.isArray(body.orders) ? body.orders : [];

      set({
        orders: rows.map((row) => rowToOrder(row)),
        loading: false,
        hasFetched: true,
      });
    } catch (err) {
      console.error('[OrderStore] fetchOrders:', err);
      set({
        loading: false,
        hasFetched: true,
        error: err instanceof Error ? err.message : 'Failed to load orders',
      });
    }
  },

  // ── Place new order — server-verified insert via /api/place-order ────────
  // The API recomputes every money field from live products/coupons rows and
  // does the insert with the service-role key, so a tampered localStorage
  // cart can no longer produce a mispriced order.
  placeOrder: async (order) => {
    try {
      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to place order');
      }

      // Local state mirrors the server's authoritative numbers.
      const placed: RealOrder = {
        ...order,
        orderNumber: body.order?.orderNumber ?? order.orderNumber,
        subtotal: body.order?.subtotal ?? order.subtotal,
        discount: body.order?.discount ?? order.discount,
        shippingCharge: body.order?.shippingCharge ?? order.shippingCharge,
        total: body.order?.total ?? order.total,
      };
      set({ orders: [placed, ...get().orders] });
      return placed;
    } catch (err) {
      console.error('[OrderStore] placeOrder:', err);
      // Re-throw so the caller (Checkout) can surface a real error
      // and avoid showing a fake success screen.
      throw err;
    }
  },

  // ── Update order status ─────────────────────────────────────────────────────
  updateOrderStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Swallow, but do NOT apply the optimistic write — the admin would
      // see a status the database never accepted.
      console.error('[OrderStore] updateOrderStatus:', err);
      return;
    }
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
      ),
    });
  },

  // ── Delete order ────────────────────────────────────────────────────────────
  deleteOrder: async (id) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Keep the row in the local list — deleting only the admin's view
      // while the DB row survives is the worse failure mode.
      console.error('[OrderStore] deleteOrder:', err);
      return;
    }
    set({
      orders: get().orders.filter((o) => o.id !== id),
    });
  },

  // ── Update payment status ───────────────────────────────────────────────────
  updatePaymentStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[OrderStore] updatePaymentStatus:', err);
      return;
    }
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, paymentStatus: status, updatedAt: new Date().toISOString() }
          : o,
      ),
    });
  },

  // ── Full order update ───────────────────────────────────────────────────────
  updateOrder: async (updatedOrder) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(orderToRow(updatedOrder))
        .eq('id', updatedOrder.id);

      if (error) throw error;
    } catch (err) {
      console.error('[OrderStore] updateOrder:', err);
      return;
    }
    set({
      orders: get().orders.map((o) =>
        o.id === updatedOrder.id
          ? { ...updatedOrder, updatedAt: new Date().toISOString() }
          : o,
      ),
    });
  },
}));
