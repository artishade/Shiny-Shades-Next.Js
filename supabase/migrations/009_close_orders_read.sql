-- =====================================================
-- Migration 009: Close the public orders read (PII leak)
--
-- schema.sql previously shipped:
--   CREATE POLICY "Anyone can look up an order by number"
--     ON orders FOR SELECT USING (TRUE);
--
-- USING (TRUE) exposes EVERY order row — name, phone, address, items,
-- notes — to anyone holding the public anon key (it's in the browser
-- bundle). The storefront only needs to poll ONE narrow status row for
-- an order number the customer already knows, which the
-- get_order_status() RPC (migration 008) provides safely.
--
-- After this runs, the anon key can no longer SELECT orders at all.
-- The admin panel must fetch orders through a server route that uses
-- requireAdmin() + the service-role key (see /api/admin-orders).
-- =====================================================

DROP POLICY IF EXISTS "Anyone can look up an order by number" ON orders;
DROP POLICY IF EXISTS "Anyone can place an order" ON orders;
DROP POLICY IF EXISTS "Anyone can add items to an order" ON order_items;

-- Keep guest checkout working: anonymous INSERT on orders/order_items is
-- still required (checkout has no login), but reads now go only through
-- the RPC.
CREATE POLICY "Guests can place an order" ON orders
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Guests can add items to an order" ON order_items
  FOR INSERT WITH CHECK (TRUE);

-- Admin reads/writes stay via is_admin() policies (already in schema.sql).
