-- ============================================================
-- Migration 008: Drop tables that have no frontend usage
-- ============================================================
-- trip_ratings, trip_comments, trip_copies were created in migration 007
-- but have zero frontend (web/mobile) usage.
-- The backend routes in shared_trips.py will also be removed.
-- trip_copies must be dropped first (FK ref to trips).
-- ============================================================

DROP TABLE IF EXISTS trip_copies;
DROP TABLE IF EXISTS trip_comments;
DROP TABLE IF EXISTS trip_ratings;
