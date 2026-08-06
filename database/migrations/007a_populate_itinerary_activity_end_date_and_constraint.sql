-- Populate end_date for existing rows and add a constraint/index for multi-day activities
BEGIN;

-- Set existing rows' end_date to activity_date when null
UPDATE itinerary_activities SET end_date = activity_date WHERE end_date IS NULL;

-- Add constraint to ensure end_date >= activity_date when present (safe: skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_activity_dates'
  ) THEN
    ALTER TABLE itinerary_activities
      ADD CONSTRAINT valid_activity_dates CHECK (end_date IS NULL OR end_date >= activity_date);
  END IF;
END $$;

-- Add index to help queries filtering by end_date
CREATE INDEX IF NOT EXISTS idx_activities_trip_end_date ON itinerary_activities(trip_id, end_date);

COMMIT;
