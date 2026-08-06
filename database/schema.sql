-- ============================================================
-- UStrip — Complete Database Schema (Source of Truth)
-- ============================================================
-- This file creates a fresh database from scratch.
-- Migrations (002–009) are for upgrading an existing installation.
-- Last updated: 2026-08 (post-refactor cleanup)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- Enum Types
-- ============================================================
create type trip_role as enum ('owner', 'member');
create type contribution_status as enum ('paid', 'partial', 'unpaid');
create type expense_category as enum ('food', 'transport', 'hotel', 'ticket', 'shopping', 'other');
create type expense_payment_source as enum ('shared_fund', 'personal');
create type split_method as enum ('equal');
create type notification_type as enum ('contribution_reminder', 'new_expense', 'itinerary_update', 'member_added');
create type payment_status as enum ('pending', 'success', 'failed', 'cancelled', 'expired');
create type invitation_status as enum ('pending', 'accepted', 'declined');

-- ============================================================
-- Core Tables
-- ============================================================

create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  destination text not null,
  start_date date not null,
  end_date date not null,
  estimated_budget numeric(14,2) not null default 0 check (estimated_budget >= 0),
  description text,
  cover_image_url text,
  visibility text not null default 'private' check (visibility in ('private', 'link', 'public')),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_trip_dates check (end_date >= start_date)
);

create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role trip_role not null default 'member',
  -- contribution tracking (denormalized, refreshed by fund_service)
  contribution_status contribution_status not null default 'unpaid',
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  remaining_amount numeric(14,2) not null default 0 check (remaining_amount >= 0),
  invitation_status invitation_status not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

-- ============================================================
-- Itinerary
-- ============================================================

create table itinerary_activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  activity_date date not null,
  end_date date,
  start_time time,
  end_time time,
  location text,
  location_name text,
  address text,
  latitude numeric(10,7) check (latitude between -90 and 90),
  longitude numeric(10,7) check (longitude between -180 and 180),
  place_id text,
  map_provider text not null default 'openstreetmap',
  estimated_cost numeric(14,2) not null default 0 check (estimated_cost >= 0),
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_activity_dates check (end_date is null OR end_date >= activity_date)
);

create table activity_participants (
  activity_id uuid not null references itinerary_activities(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(activity_id, user_id)
);

-- ============================================================
-- Fund & Contributions
-- ============================================================

-- One shared fund per trip — stores the target collection amount
create table shared_funds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips(id) on delete cascade,
  target_amount numeric(14,2) not null default 0 check (target_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual contribution records (manual or MoMo)
create table fund_contributions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_proof_url text,
  note text,
  payment_method text not null default 'manual' check (payment_method in ('manual', 'momo')),
  payment_status payment_status not null default 'success',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MoMo (and future gateway) payment records
create table payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  contribution_id uuid references fund_contributions(id) on delete set null,
  member_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'momo' check (provider in ('momo')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'VND',
  status payment_status not null default 'pending',
  order_id text not null unique,
  request_id text not null unique,
  transaction_id text,
  pay_url text,
  deeplink text,
  qr_code_url text,
  raw_request jsonb,
  raw_response jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Back-link from contribution to payment (circular ref — added after payments)
alter table fund_contributions
  add column payment_id uuid unique references payments(id) on delete set null;

-- ============================================================
-- Expenses & Splits
-- ============================================================

create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  amount numeric(14,2) not null check (amount > 0),
  category expense_category not null default 'other',
  payment_source expense_payment_source not null default 'personal',
  paid_by uuid references profiles(id),
  related_activity_id uuid references itinerary_activities(id) on delete set null,
  split_method split_method not null default 'equal',
  bill_image_url text,
  note text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_expense_payment_source check (
    (payment_source = 'shared_fund' and paid_by is null) or
    (payment_source = 'personal' and paid_by is not null)
  )
);

-- Who this expense was paid for (used to compute splits)
create table expense_participants (
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(expense_id, user_id)
);

-- Per-person debt breakdown for each expense
create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount_owed numeric(14,2) not null check (amount_owed >= 0),
  is_settled boolean not null default false,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(expense_id, user_id)
);

-- ============================================================
-- Messaging
-- ============================================================

create table trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Notifications & Push
-- ============================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table push_tokens (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Reminders
-- ============================================================

create table reminders (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  created_by uuid not null references profiles(id),
  message text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_trips_created_by on trips(created_by);
create index idx_trips_visibility on trips(visibility);
create index idx_trips_public_created on trips(created_at desc) where visibility = 'public';

create index idx_trip_members_user on trip_members(user_id);
create index idx_trip_members_trip on trip_members(trip_id);
create index idx_trip_members_invitation_status on trip_members(user_id, invitation_status);

create index idx_activities_trip_date on itinerary_activities(trip_id, activity_date);
create index idx_activities_trip_end_date on itinerary_activities(trip_id, end_date);

create index idx_contributions_trip on fund_contributions(trip_id);
create index idx_payments_trip_status on payments(trip_id, status);
create index idx_payments_member on payments(member_id, created_at desc);
create index idx_payments_order on payments(order_id);

create index idx_expenses_trip_date on expenses(trip_id, expense_date);
create index idx_expenses_trip_source on expenses(trip_id, payment_source);
create index idx_expense_splits_user on expense_splits(user_id, is_settled);

create index idx_trip_messages_trip on trip_messages(trip_id, created_at);
create index idx_notifications_user on notifications(user_id, is_read, created_at desc);
create index idx_push_tokens_user on push_tokens(user_id);
create index idx_reminders_trip on reminders(trip_id);

-- ============================================================
-- updated_at Trigger
-- ============================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'profiles','trips','trip_members',
    'itinerary_activities',
    'shared_funds','fund_contributions','payments',
    'expenses','expense_splits',
    'trip_messages',
    'notifications','push_tokens','reminders'
  ] loop
    execute format(
      'create trigger set_%s_updated_at before update on %s for each row execute function set_updated_at()',
      tbl, tbl
    );
  end loop;
end $$;

-- ============================================================
-- Row Level Security
-- All data access is via authenticated Express/FastAPI service role.
-- RLS is enabled on every table but no anon policies are defined,
-- so direct client access is blocked.
-- ============================================================

alter table profiles              enable row level security;
alter table trips                 enable row level security;
alter table trip_members          enable row level security;
alter table itinerary_activities  enable row level security;
alter table activity_participants enable row level security;
alter table shared_funds          enable row level security;
alter table fund_contributions    enable row level security;
alter table payments              enable row level security;
alter table expenses              enable row level security;
alter table expense_participants  enable row level security;
alter table expense_splits        enable row level security;
alter table trip_messages         enable row level security;
alter table notifications         enable row level security;
alter table push_tokens           enable row level security;
alter table reminders             enable row level security;
