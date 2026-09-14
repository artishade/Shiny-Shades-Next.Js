import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coupon } from '@/types';
import { coupons as mockCoupons } from '@/data/mockData';

/**
 * AdminDataStore holds only data that has no Supabase table yet:
 *   - Coupons (persisted in localStorage until you add a DB table)
 *
 * Products are managed by useProductStore (Supabase-backed).
 * Orders are managed by useOrderStore (Supabase-backed).
 */
interface AdminDataStore {
  coupons: Coupon[];

  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
}

/**
 * @deprecated — dead code. Nothing imports this store; coupons are fully
 * wired to Supabase via useCouponStore (see CouponsInventoryReportsShared).
 * Kept only to avoid breaking any stale import outside src/ — delete freely.
 *
 * NOTE: if this module ever gets imported again it re-seeds localStorage
 * 'website-admin-data' with expired MOCK coupons on top of real data.
 */
export const useAdminDataStore = create<AdminDataStore>()(
  persist(
    (set, get) => ({
      coupons: mockCoupons,

      addCoupon: (coupon) =>
        set({ coupons: [...get().coupons, coupon] }),

      updateCoupon: (id, updates) =>
        set({
          coupons: get().coupons.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }),

      deleteCoupon: (id) =>
        set({ coupons: get().coupons.filter((c) => c.id !== id) }),

      toggleCoupon: (id) =>
        set({
          coupons: get().coupons.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive } : c,
          ),
        }),
    }),
    { name: 'website-admin-data' },
  ),
);
