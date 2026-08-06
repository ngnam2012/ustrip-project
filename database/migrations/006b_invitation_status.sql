-- Migration 006b: Add invitation_status to trip_members
-- Existing rows will default to 'accepted', preserving all current memberships.

do $$ begin
  create type invitation_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $$;

alter table trip_members
  add column if not exists invitation_status invitation_status not null default 'accepted';

create index if not exists idx_trip_members_invitation_status on trip_members(user_id, invitation_status);
