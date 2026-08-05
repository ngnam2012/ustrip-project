-- ============================================================
-- Migration 007: Shared Trips
-- Adds: visibility on trips, trip_ratings, trip_comments, trip_copies
-- ============================================================

-- 1. Add visibility column to existing trips table
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'link', 'public'));

CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility);
CREATE INDEX IF NOT EXISTS idx_trips_public_created ON trips(created_at DESC) WHERE visibility = 'public';

-- 2. Trip ratings (1–5 stars, one updatable rating per user per trip)
CREATE TABLE IF NOT EXISTS trip_ratings (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID     NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     UUID     NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_ratings_trip ON trip_ratings(trip_id);

-- 3. Trip comments (threaded via parent_id)
CREATE TABLE IF NOT EXISTS trip_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES trip_comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_comments_trip ON trip_comments(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_comments_parent ON trip_comments(parent_id);

-- 4. Trip copies / clones log
CREATE TABLE IF NOT EXISTS trip_copies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  cloned_trip_id   UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  cloned_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_copies_original ON trip_copies(original_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_copies_cloned ON trip_copies(cloned_by);

-- 5. updated_at triggers
CREATE TRIGGER set_trip_ratings_updated_at
  BEFORE UPDATE ON trip_ratings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_trip_comments_updated_at
  BEFORE UPDATE ON trip_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Enable RLS (all data access via authenticated API server)
ALTER TABLE trip_ratings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_copies   ENABLE ROW LEVEL SECURITY;
