-- Stores one Expo push token per installed app/device.
-- Run this migration when upgrading an existing UsTrip database.

create table if not exists push_tokens (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on push_tokens(user_id);

drop trigger if exists set_push_tokens_updated_at on push_tokens;
create trigger set_push_tokens_updated_at before update on push_tokens
for each row execute function set_updated_at();

alter table push_tokens enable row level security;
