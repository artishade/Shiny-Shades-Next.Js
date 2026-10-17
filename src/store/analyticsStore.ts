/**
 * Analytics Store
 *
 * Fetches visitor analytics data from /api/admin-analytics and caches it
 * in Zustand. The admin panel's analytics dashboard reads from here.
 *
 * Data is NOT persisted to localStorage — it's always fetched fresh
 * because analytics trends change rapidly.
 */

import { create } from 'zustand';

export interface VisitorsOverTime {
  date: string;
  count: number;
}

export interface DeviceBreakdown {
  device_type: string;
  count: number;
  percentage: number;
}

export interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

export interface PageData {
  pathname: string;
  count: number;
  percentage: number;
}

export interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  visitorsOverTime: VisitorsOverTime[];
  deviceBreakdown: DeviceBreakdown[];
  topCountries: CountryData[];
  topPages: PageData[];
  browserBreakdown: BrowserBreakdown[];
  days: number;
}

interface AnalyticsStore {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;

  fetchAnalytics: (days?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const DAYS_OPTIONS = [7, 14, 30, 90] as const;
const DEFAULT_DAYS = 30;

export const useAnalyticsStore = create<AnalyticsStore>()((set, get) => ({
  data: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchAnalytics: async (days?: number) => {
    const requestedDays = days ?? DEFAULT_DAYS;
    const cacheKey = requestedDays;

    // Don't re-fetch if we just fetched the same range within 30s
    const currentData = get().data;
    if (currentData && currentData.days === cacheKey && get().lastFetched) {
      const lastFetched = get().lastFetched;
      if (!lastFetched) return;
      const elapsed = Date.now() - new Date(lastFetched).getTime();
      if (elapsed < 30000) return;
    }

    set({ loading: true, error: null });

    try {
      const token = (await import('@/lib/supabase')).supabase.auth.getSession().then(
        (r) => r.data?.session?.access_token,
      );
      const accessToken = await token;

      if (!accessToken) {
        throw new Error('Admin session required');
      }

      const res = await fetch(`/api/admin-analytics?days=${requestedDays}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load analytics');
      }

      const body = await res.json();

      set({
        data: { ...body, days: requestedDays },
        loading: false,
        error: null,
        lastFetched: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[AnalyticsStore]', err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load analytics',
        lastFetched: null,
      });
    }
  },

  refresh: async () => {
    const days = get().data?.days ?? DEFAULT_DAYS;
    set({ data: null, error: null });
    await get().fetchAnalytics(days);
  },
}));
