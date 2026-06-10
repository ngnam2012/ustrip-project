-- Separates expenses paid from the shared fund from expenses paid personally.
-- Existing expenses stay personal so this migration never unexpectedly
-- subtracts historical expenses from the shared fund.

do $$ begin
  create type expense_payment_source as enum ('shared_fund', 'personal');
exception when duplicate_object then null;
end $$;

alter table expenses
  add column if not exists payment_source expense_payment_source not null default 'personal';

alter table expenses alter column paid_by drop not null;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'valid_expense_payment_source'
  ) then
    alter table expenses add constraint valid_expense_payment_source check (
      (payment_source = 'shared_fund' and paid_by is null) or
      (payment_source = 'personal' and paid_by is not null)
    );
  end if;
end $$;

create index if not exists idx_expenses_trip_source on expenses(trip_id, payment_source);
