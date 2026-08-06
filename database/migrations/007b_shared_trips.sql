-- ============================================================
-- Migration 007b: Shared Trips — visibility only
-- trip_ratings, trip_comments, trip_copies were created here
-- but have been dropped in migration 008 (unused tables cleanup).
-- Only the visibility column is retained.
-- ============================================================

-- Add visibility column to trips (idempotent)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'link', 'public'));

CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility);
CREATE INDEX IF NOT EXISTS idx_trips_public_created ON trips(created_at DESC) WHERE visibility = 'public';
