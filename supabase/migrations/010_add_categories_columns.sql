-- =====================================================
-- Migration 010: Add missing is_active + updated_at to categories
--
-- The live categories table drifted from schema.sql: it was created
-- before is_active/updated_at were added to the canonical schema, and
-- no migration ever back-filled them. Queries that filter on
-- is_active (e.g. CategoryStore.loadCategories) blow up with
-- PostgreSQL 42703: "column categories.is_active does not exist".
--
-- This migration back-fills existing rows (active by default) then
-- sets up the columns so future inserts default sensibly. All
-- statements are idempotent.
-- =====================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;

-- Back-fill any legacy rows that were created before this column existed.
-- Every category that lacks an explicit is_active is treated as active,
-- which preserves the behaviour that every category is visible by default.
UPDATE categories
   SET is_active = TRUE
 WHERE is_active IS NULL;
