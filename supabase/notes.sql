-- Dev Lab: notes table
-- Run this in the Supabase SQL Editor at the start of Session 2.

create table if not exists notes (
  id         bigint generated always as identity primary key,
  name       text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- Allow anonymous reads and writes for now (Auth0 login arrives in Session 3).
alter table notes enable row level security;

create policy "Anyone can read notes"
  on notes for select
  using (true);

create policy "Anyone can insert notes"
  on notes for insert
  with check (true);
