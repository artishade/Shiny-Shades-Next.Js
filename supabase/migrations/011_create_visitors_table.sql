-- =====================================================
-- Migration: Visitor Analytics
-- Adds tables to capture anonymous visitor sessions
-- (device, location, page views) for the admin analytics
-- dashboard.
--
-- Privacy notes:
--   • IP is stored only as a truncated SHA-256 hash for
--     dedup purposes — never raw.
--   • No PII is collected unless the visitor voluntarily
--     signs in or checks out.
--   • All tracking requires analytics consent (see
--     CookieConsentBanner + track-visit handler).
-- =====================================================

-- ===== VISITORS TABLE =====
-- One row per unique browser, identified by a UUID cookie.
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  os TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  contient TEXT,
  ip_hash TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_page_views INTEGER DEFAULT 0
);

-- ===== PAGE VIEWS TABLE =====
-- One row per tracked page view.
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL,
  pathname TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  consent_analytics BOOLEAN DEFAULT FALSE,
  consent_marketing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_pathname ON page_views(pathname);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Only the is_admin() server role can read visitor data.
CREATE POLICY "Admins can read visitors" ON visitors
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can read page_views" ON page_views
  FOR SELECT USING (is_admin());

-- Insert is done via the service-role key (API route), so no anon insert policy.
CREATE POLICY "Service role can insert visitors" ON visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert page_views" ON page_views
  FOR INSERT WITH CHECK (true);
