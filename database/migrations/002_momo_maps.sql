-- Run this migration only when upgrading an existing UsTrip database that
-- already has the original schema. New installations can run schema.sql.

do $$ begin
  create type payment_status as enum ('pending', 'success', 'failed', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

alter table itinerary_activities
  add column if not exists location_name text,
  add column if not exists address text,
  add column if not exists latitude numeric(10,7) check (latitude between -90 and 90),
  add column if not exists longitude numeric(10,7) check (longitude between -180 and 180),
  add column if not exists place_id text,
  add column if not exists map_provider text not null default 'openstreetmap';

alter table fund_contributions
  add column if not exists payment_method text not null default 'manual',
  add column if not exists payment_status payment_status not null default 'success',
  add column if not exists paid_at timestamptz;

create table if not exists payments (
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

alter table fund_contributions
  add column if not exists payment_id uuid unique references payments(id) on delete set null;

create index if not exists idx_payments_trip_status on payments(trip_id, status);
create index if not exists idx_payments_member on payments(member_id, created_at desc);
create index if not exists idx_payments_order on payments(order_id);

drop trigger if exists set_payments_updated_at on payments;
create trigger set_payments_updated_at before update on payments
for each row execute function set_updated_at();

alter table payments enable row level security;
