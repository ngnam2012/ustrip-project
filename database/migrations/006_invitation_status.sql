-- Migration 006: Add invitation_status to trip_members
-- Run this against your Supabase SQL editor or psql.
-- Existing rows will default to 'accepted', preserving all current memberships.

create type invitation_status as enum ('pending', 'accepted', 'declined');

alter table trip_members
  add column invitation_status invitation_status not null default 'accepted';

create index idx_trip_members_invitation_status on trip_members(user_id, invitation_status);
