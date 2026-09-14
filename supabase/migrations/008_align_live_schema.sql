-- =====================================================
-- Migration 008: Align schema.sql with the live database
--
-- The live Supabase project drifted from supabase/schema.sql before this
-- file existed. Running only schema.sql on a fresh database breaks the
-- app: checkout inserts columns that don't exist (orders.customer_*,
-- orders.items, orders.shipping_charge), the content store reads a
-- site_content table that isn't defined, and payment/track-order call
-- RPCs that were never created. This migration adds those pieces so a
-- fresh install matches what the deployed app actually writes.
--
-- NOTE: if your database already has these (it does, if the live site
-- works), every statement here is IF NOT EXISTS / OR REPLACE safe.
-- =====================================================

-- ── 1. site_content — the single content row the storefront reads ──────────
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,                 -- 'global-content'
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Anyone (guest storefront) can read the site content row…
CREATE POLICY "Public can read site content" ON site_content
  FOR SELECT USING (TRUE);
-- …but only admins can write it.
CREATE POLICY "Admins can manage site content" ON site_content
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── 2. newsletter_subscribers — footer signup inserts here ────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'footer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Public INSERT only — nobody can read the subscriber list back.
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

-- ── 3. orders columns the live app writes ──────────────────────────────────
-- Checkout writes denormalized customer_* columns and a JSONB items array;
-- admin stores additionally write shipping_charge.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_first_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_last_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2) DEFAULT 0;
-- Legacy column name in schema.sql was shipping_cost — keep both in sync.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- ── 4. products columns the live app writes ────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_text TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';

-- ── 5. get_order_status RPC — used by /payment/success and /track-order ────
-- SECURITY DEFINER + no SELECT policy on the orders table for anon: the
-- storefront can look up exactly one narrow status row for an order number
-- it already knows, and nothing else.
CREATE OR REPLACE FUNCTION get_order_status(p_order_number TEXT)
RETURNS TABLE (order_number TEXT, payment_status TEXT, status TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.order_number, o.payment_status, o.status
  FROM orders o
  WHERE o.order_number = upper(p_order_number)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_order_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_order_status(TEXT) TO anon, authenticated;

-- ── 6. check_rate_limit RPC — backing for src/pages/api/_lib/rateLimit.js ──
-- Fixed-window counter in a scratch table. The API layer treats an RPC
-- error as fail-open, so this only needs to be correct, not transactional.
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  hits BIGINT NOT NULL DEFAULT 0
);
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY; -- service-role only

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_hits BIGINT;
BEGIN
  SELECT window_start, hits INTO v_window_start, v_hits
  FROM rate_limit_buckets WHERE key = p_key FOR UPDATE;

  IF v_window_start IS NULL OR v_now - v_window_start > make_interval(secs => p_window_seconds) THEN
    -- New window (also the insert path for a first-time key).
    INSERT INTO rate_limit_buckets (key, window_start, hits)
    VALUES (p_key, v_now, 1)
    ON CONFLICT (key) DO UPDATE
      SET window_start = v_now, hits = 1;
    RETURN TRUE;
  END IF;

  v_hits := v_hits + 1;
  UPDATE rate_limit_buckets SET hits = v_hits WHERE key = p_key;
  RETURN v_hits <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO anon, authenticated;

-- ── 7. increment_coupon_usage RPC — used by /api/place-order ──────────────
-- Atomic bump so two simultaneous orders can't both read the same used_count.
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE code = upper(p_code) AND is_active = TRUE;
$$;

REVOKE ALL ON FUNCTION increment_coupon_usage(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(TEXT) TO anon, authenticated;
