CREATE TABLE IF NOT EXISTS trip_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_trip_messages_updated_at ON trip_messages;
CREATE TRIGGER set_trip_messages_updated_at
    BEFORE UPDATE ON trip_messages
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
