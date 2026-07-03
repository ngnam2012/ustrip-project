CREATE TABLE trip_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_trip_messages_updated_at
    BEFORE UPDATE ON trip_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Since all API access is via service role, RLS policies can be kept strict
CREATE POLICY "Strict internal access for trip_messages"
    ON trip_messages FOR ALL USING (false);
