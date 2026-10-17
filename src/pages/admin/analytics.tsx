/**
 * Shiny Shades - Admin Analytics Dashboard
 *
 * Shows visitor analytics: total visitors, page views, device breakdown,
 * top countries, browser distribution, and most-visited pages.
 *
 * Data comes from /api/admin-analytics, which reads the `visitors` and
 * `page_views` Supabase tables populated by /api/track-visit.
 *
 * Social ID / Gender:
 *   These are NOT available from browser JS without OAuth login.
 *   See the placeholder card below for guidance.
 */

import { AdminAuthLayout } from '@/components/layout/AdminAuthLayout';
import React, { useEffect, useState } from 'react';
import { m as motion } from 'framer-motion';
import {
  Users, Eye, Smartphone, Laptop, Tablet,
  Globe, BarChart3, Clock, RefreshCw,
  BarChart,

} from 'lucide-react';
import { FadeIn } from '@/components/ui';
import { useAnalyticsStore, type AnalyticsData } from '@/store';

// ─── Time-range selector ─────────────────────────────────────────────

const TIME_RANGES = [7, 14, 30, 90] as const;
const RANGE_LABELS = { 7: '7 days', 14: '14 days', 30: '30 days', 90: '90 days' };

// ─── Device icons ────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ElementType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
  unknown: Users,
};

// ─── Visitors-over-time bar chart ────────────────────────────────────

const VisitorsBarChart: React.FC<{ data: AnalyticsData['visitorsOverTime'] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B5B55]">
        No data for this period yet — the chart will fill as visitors arrive.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-40 overflow-x-auto py-2">
      {data.map((d, i) => (
        <div key={d.date} className="flex flex-col items-center min-w-[32px] flex-shrink-0">
          <span className="text-[9px] text-[#6B5B55] mb-1">{d.count}</span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 4 : 0)}%` }}
            transition={{ duration: 0.5, delay: i * 0.03 }}
            className={`w-5 rounded-t chart-bar ${d.count > 0 ? 'chart-bar-filled' : 'bg-gray-200'}`}
            title={`${d.date}: ${d.count} visitors`}
          />
          <span className="text-[8px] text-[#6B5B55] mt-1 rotate-[-45deg] origin-top-left leading-none">
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Donut chart for device / browser / country ─────────────────────

const DonutChart: React.FC<{
  data: { name: string; count: number; percentage: number }[];
  colors: string[];
}> = ({ data, colors }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-[#6B5B55] text-sm py-4">No data</p>;
  }

  // CSS conic-gradient donut
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const start = cumulative;
    cumulative += d.percentage;
    const end = cumulative;
    return {
      ...d,
      color: colors[i % colors.length],
      start,
      end,
    };
  });

  // Add a trailing segment to fill gaps if percentages don't sum to 100
  if (cumulative < 100) {
    segments.push({
      name: 'Other',
      count: 0,
      percentage: 100 - cumulative,
      color: '#E5E7EB',
      start: cumulative,
      end: 100,
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <div
          className="w-24 h-24 rounded-full"
          style={{
            background: `conic-gradient(${segments
              .filter((s) => s.percentage > 0)
              .map((s) => `${s.color} ${s.start}deg ${s.end}deg`)
              .join(', ')})`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white">
          <span className="text-xs font-medium text-charcoal">{data.reduce((sum, d) => sum + d.count, 0)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-[#6B5B55] capitalize">{d.name}</span>
            <span className="text-charcoal font-medium">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  gradient?: string;
}> = ({ label, value, icon: Icon, sub, gradient = 'stat-gradient-1' }) => (
  <div className={`glass-card rounded-2xl p-5 ${gradient}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
        <Icon size={20} className="text-rose-gold" />
      </div>
      {sub && <span className="text-xs font-medium text-[#6B5B55]">{sub}</span>}
    </div>
    <p className="heading-serif text-2xl font-bold text-charcoal">{value}</p>
    <p className="text-sm text-[#6B5B55] mt-0.5">{label}</p>
  </div>
);

// ─── Main Analytics Page ─────────────────────────────────────────────

export const AdminAnalytics: React.FC = () => {
  const { data, loading, error, fetchAnalytics, refresh } = useAnalyticsStore();
  const [activeRange, setActiveRange] = useState<7 | 14 | 30 | 90>(30);

  useEffect(() => {
    fetchAnalytics(activeRange);
  }, [activeRange, fetchAnalytics]);

  const donutColors = ['#B76E79', '#E8C4C0', '#D4A5A5', '#8A8178', '#F3D3CB'];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
              Visitor Analytics
            </h1>
            <p className="text-[#6B5B55] mt-1">
              Track who visits your store — devices, locations, and behavior.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blush-light hover:bg-blush transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 mt-4 bg-blush-light/30 rounded-lg p-1 inline-flex">
          {TIME_RANGES.map((days) => (
            <button
              key={days}
              onClick={() => setActiveRange(days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeRange === days
                  ? 'bg-rose-gold text-white shadow-md'
                  : 'text-[#6B5B55] hover:text-charcoal'
              }`}
            >
              {RANGE_LABELS[days]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-12 text-[#6B5B55]">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
          <p>Loading analytics…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Data loaded */}
      {data && (
        <>
          {/* ── Overview Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <FadeIn delay={0.1}>
              <StatCard
                label="Total Visitors"
                value={data.totalVisitors.toLocaleString()}
                icon={Users}
                sub={`${data.visitorsOverTime.reduce((sum, d) => sum + d.count, 0)} visits`}
                gradient="stat-gradient-1"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <StatCard
                label="Page Views"
                value={data.totalPageViews.toLocaleString()}
                icon={Eye}
                sub="Pages loaded"
                gradient="stat-gradient-2"
              />
            </FadeIn>
            <FadeIn delay={0.3}>
              <StatCard
                label="Avg. per Visit"
                value={(data.totalVisitors > 0
                  ? (data.totalPageViews / data.totalVisitors).toFixed(1)
                  : '0').toString()}
                icon={BarChart3}
                sub="Pages / visitor"
                gradient="stat-gradient-3"
              />
            </FadeIn>
            <FadeIn delay={0.4}>
              <StatCard
                label="Countries"
                value={data.topCountries.length.toString()}
                icon={Globe}
                sub="Visited in period"
                gradient="stat-gradient-4"
              />
            </FadeIn>
          </div>

          {/* ── Visitors Over Time ── */}
          <FadeIn delay={0.3}>
            <div className="glass-card rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-charcoal">Visitors Over Time</h3>
                  <p className="text-sm text-[#6B5B55]">
                    Unique visitors per day (last {activeRange} days)
                  </p>
                </div>
                <Clock size={20} className="text-rose-gold" />
              </div>

              <VisitorsBarChart data={data.visitorsOverTime} />

              {!data.visitorsOverTime || data.visitorsOverTime.every((d) => d.count === 0) ? (
                <p className="text-center text-[#6B5B55] text-sm mt-4">
                  No visitor data yet — install the consent banner to start tracking.
                </p>
              ) : null}
            </div>
          </FadeIn>

          {/* ── Device + Browser Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FadeIn delay={0.2}>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-charcoal">Device Types</h3>
                    <p className="text-sm text-[#6B5B55]">How people browse your store</p>
                  </div>
                  <Smartphone size={20} className="text-rose-gold" />
                </div>
                <DonutChart
                  data={data.deviceBreakdown.map((d) => ({ name: d.device_type, count: d.count, percentage: d.percentage }))}
                  colors={donutColors}
                />
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-charcoal">Browsers</h3>
                    <p className="text-sm text-[#6B5B55]">Browser distribution</p>
                  </div>
                  <BarChart size={20} className="text-rose-gold" />
                </div>
                <DonutChart
                  data={data.browserBreakdown.map((d) => ({ name: d.browser, count: d.count, percentage: d.percentage }))}
                  colors={donutColors}
                />
              </div>
            </FadeIn>
          </div>

          {/* ── Top Countries + Top Pages ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Countries */}
            <FadeIn delay={0.2}>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal">Top Countries</h3>
                  <Globe size={20} className="text-rose-gold" />
                </div>
                {data.topCountries.length === 0 ? (
                  <p className="text-[#6B5B55] text-sm">No location data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topCountries.map((c) => (
                      <div key={c.country} className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">
                          {countryToFlag(c.country)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-charcoal">{c.country}</p>
                          <div className="w-full h-2 bg-blush-light/30 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-rose-gold rounded-full"
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-[#6B5B55] w-12 text-right">
                          {c.count} ({c.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>

            {/* Top Pages */}
            <FadeIn delay={0.3}>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal">Top Pages</h3>
                  <Eye size={20} className="text-rose-gold" />
                </div>
                {data.topPages.length === 0 ? (
                  <p className="text-[#6B5B55] text-sm">No page view data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topPages.map((p) => (
                      <div key={p.pathname} className="flex items-center gap-3">
                        <span className="text-xs text-[#6B5B55] w-48 truncate">{p.pathname}</span>
                        <div className="flex-1">
                          <div className="w-full h-2 bg-blush-light/30 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-rose-gold rounded-full"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-[#6B5B55] w-16 text-right">
                          {p.count} ({p.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* ── Social ID / Gender Placeholder ── */}
          <FadeIn delay={0.4}>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Users size={18} />
                Social Login Insights
              </h3>
              <div className="p-4 bg-blush-light/30 rounded-xl">
                <p className="text-sm text-[#6B5B55] leading-relaxed">
                  Social ID profiles and gender data require <strong>OAuth login</strong> (Google, Facebook, etc.)
                  to be available. This store currently supports guest checkout, so browsers cannot
                  share those identifiers. To enable this data:
                </p>
                <ul className="mt-2 text-sm text-[#6B5B55] space-y-1">
                  <li>• Add social login providers via Supabase Auth settings</li>
                  <li>• Update the checkout flow to optionally sign users in</li>
                  <li>• Gender can then be requested via the provider profile API (with consent)</li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
};

/**
 * Converts a country name to a regional indicator flag emoji.
 * Falls back to 🌐 for unknown country names.
 */
function countryToFlag(country: string): string {
  const code = countryToIso(country);
  if (!code || code.length !== 2) return '🌐';
  const [a, b] = code.split('');
  return String.fromCodePoint(0x1F1E6 + a.toLowerCase().charCodeAt(0) - 97) +
    String.fromCodePoint(0x1F1E6 + b.toLowerCase().charCodeAt(0) - 97);
}

/**
 * Maps common country names to ISO 3166-1 alpha-2 codes for flag emojis.
 * Returns the first match for partial name matches.
 */
function countryToIso(country: string): string | null {
  const map: Record<string, string> = {
    'bangladesh': 'BD',
    'united states': 'US',
    'united kingdom': 'GB',
    'canada': 'CA',
    'australia': 'AU',
    'germany': 'DE',
    'france': 'FR',
    'italy': 'IT',
    'spain': 'ES',
    'netherlands': 'NL',
    'belgium': 'BE',
    'switzerland': 'CH',
    'swe': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'russia': 'RU',
    'japan': 'JP',
    'south korea': 'KR',
    'china': 'CN',
    'india': 'IN',
    'pakistan': 'PK',
    'indonesia': 'ID',
    'malaysia': 'MY',
    'singapore': 'SG',
    'thailand': 'TH',
    'vietnam': 'VN',
  };

  const lower = country.toLowerCase();
  for (const [key, code] of Object.entries(map)) {
    if (lower.includes(key)) return code;
  }
  return null;
}

AdminAnalytics.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminAuthLayout>{page}</AdminAuthLayout>;
};

export default AdminAnalytics;
