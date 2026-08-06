-- ============================================================
-- Migration 009: Drop contributed_at from fund_contributions
-- ============================================================
-- contributed_at is redundant with created_at.
-- The API sorts by contributed_at desc — after this migration, sort by created_at.
-- The server (funds.py) will be updated to use created_at.
-- ============================================================

ALTER TABLE fund_contributions DROP COLUMN IF EXISTS contributed_at;
 