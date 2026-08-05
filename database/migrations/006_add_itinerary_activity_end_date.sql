-- Add end_date column to itinerary_activities for multi-day activities
ALTER TABLE itinerary_activities
  ADD COLUMN end_date date;
