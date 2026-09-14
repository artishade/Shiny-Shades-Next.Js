//cartStore.ts 

declare global { interface Window { dataLayer: any[]; } }
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Coupon } from '@/types';
import { useCouponStore } from './couponStore';
import { trackAddToCart } from '@/lib/facebookPixel';
import { SITE } from '@/config/siteConfig';

interface CartStore {
  items: CartItem[];
  coupon: Coupon | null;
  couponCode: string;
  couponError: string;

  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;

  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

/**
 * Admin saves coupon expiries as date-only strings ('2026-12-31'), which
 * JS parses as UTC midnight — the START of that day. Comparing strictly
 * against "now" expired the coupon during its last valid day, so the
 * whole final day is treated as still valid.
 */
export const isCouponExpired = (expiresAt: string): boolean => {
  if (!expiresAt) return false;
  const endOfDay = new Date(`${expiresAt.slice(0, 10)}T23:59:59.999`);
  if (Number.isNaN(endOfDay.getTime())) return false;
  return endOfDay.getTime() < Date.now();
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponCode: '',
      couponError: '',

      addItem: (product, size, color, quantity = 1) => {
        const items = get().items;

        const existingIndex = items.findIndex(
          (i) =>
            i.product.id === product.id &&
            i.selectedSize === size &&
            i.selectedColor === color,
        );

        // Never let a cart line exceed live stock — the cart page only
        // blocks manual increases, so an unclamped addItem could push a
        // line past what the store can fulfil.
        const stockCap = product.stock > 0 ? product.stock : Infinity;

        if (existingIndex >= 0) {
          const newItems = [...items];

          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: Math.min(
              newItems[existingIndex].quantity + quantity,
              stockCap,
            ),
          };

          set({ items: newItems });
        } else {
          set({
            items: [
              ...items,
              {
                product,
                quantity: Math.min(quantity, stockCap),
                selectedSize: size,
                selectedColor: color,
              },
            ],
          });
        }

        // FACEBOOK PIXEL TRACKING
        trackAddToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
        });
        /* GTM DATA LAYER — add_to_cart */
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: 'add_to_cart',
          ecommerce: {
            currency: SITE.currency.code,
            value: product.price * quantity,
            items: [{
              item_id: product.id,
              item_name: product.name,
              item_category: product.category,
              price: product.price,
              quantity: quantity,
            }],
          },
        });
      },


      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.product.id === productId &&
                i.selectedSize === size &&
                i.selectedColor === color
              ),
          ),
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId &&
              i.selectedSize === size &&
              i.selectedColor === color
              ? { ...i, quantity }
              : i,
          ),
        });
      },

      clearCart: () =>
        set({ items: [], coupon: null, couponCode: '', couponError: '' }),

      applyCoupon: (code) => {
        // ✅ Pull real, live coupons from Supabase (admin-created coupons)
        const coupon = useCouponStore
          .getState()
          .coupons.find(
            (c) => c.code.toLowerCase() === code.toLowerCase() && c.isActive,
          );

        if (!coupon) {
          set({ couponError: 'Invalid coupon code', coupon: null, couponCode: '' });
          return;
        }
        if (isCouponExpired(coupon.expiresAt)) {
          set({ couponError: 'Coupon has expired', coupon: null, couponCode: '' });
          return;
        }
        if (coupon.usedCount >= coupon.maxUses) {
          set({
            couponError: 'Coupon usage limit reached',
            coupon: null,
            couponCode: '',
          });
          return;
        }
        const subtotal = get().getSubtotal();
        if (subtotal < coupon.minOrderAmount) {
          set({
            // ✅ BDT symbol instead of hardcoded $
            couponError: `Minimum order amount is ${SITE.currency.symbol}${coupon.minOrderAmount}`,
            coupon: null,
            couponCode: '',
          });
          return;
        }
        set({ coupon, couponCode: code, couponError: '' });
      },

      removeCoupon: () => set({ coupon: null, couponCode: '', couponError: '' }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        ),

      getDiscount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        // Revalidate on every read: the cart can shrink below the coupon's
        // minimum after the coupon was applied, or the coupon can expire
        // while it sits in a persisted cart.
        if (isCouponExpired(coupon.expiresAt)) return 0;
        if (subtotal < coupon.minOrderAmount) return 0;
        return coupon.type === 'percentage'
          ? (subtotal * coupon.discount) / 100
          : Math.min(coupon.discount, subtotal);
      },

      getTotal: () => get().getSubtotal() - get().getDiscount(),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart',
      // Rehydrate manually in _app's AppBoot (see hydrateStores): doing it
      // during module init mismatches the prerendered HTML for anyone with
      // a saved cart, and React 19 turns that into a full client re-render.
      skipHydration: true,
    },
  ),
);