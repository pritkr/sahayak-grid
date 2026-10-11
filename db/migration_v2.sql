-- Sahayak Grid v2 — sync analytics + application windows.
-- Run AFTER db/schema.sql (and db/seed.sql). Idempotent: safe to re-run.
--
-- Usage (Supabase SQL editor or psql):
--   \i db/schema.sql
--   \i db/seed.sql
--   \i db/migration_v2.sql

-- 1. Application window on schemes (free text, e.g. '01 Sep – 28 Sep 2026').
alter table schemes add column if not exists window text;

-- 2. Sync-event log: every POST /sync attempt (dev API keeps these counters in memory;
--    production inserts one row per attempt so /stats survives restarts).
create table if not exists sync_events (
  id bigint generated always as identity primary key,
  op_id text,
  op_type text not null,
  status text not null check (status in ('synced', 'duplicate', 'failed')),
  mobile text,
  created_at timestamptz not null default now()
);
create index if not exists sync_events_status_idx on sync_events (status);
create index if not exists sync_events_created_idx on sync_events (created_at);

alter table sync_events enable row level security;
drop policy if exists "service role writes sync events" on sync_events;
-- Writes happen via the edge function (service role bypasses RLS); nobody reads PII directly.
-- Dashboard aggregates (counts by status) are exposed through the /stats API route only.

-- 3. Staggered v2 deadlines: 2 critical (≤7d), 3 soon (≤30d), 3 open (>30d)
--    relative to the Sep-2026 field season. Re-run the seed to apply.
update schemes set deadline = '2026-10-23', window = '01 Jul – 23 Oct 2026' where id = 'mmkpy';
update schemes set deadline = '2026-10-10', window = '01 Sep – 10 Oct 2026' where id = 'mmbsy';
update schemes set deadline = '2027-03-31', window = '01 Jul 2026 – 31 Mar 2027' where id = 'bssby';
update schemes set deadline = '2026-09-28', window = '01 Sep – 28 Sep 2026' where id = 'mmsy';
update schemes set deadline = '2027-01-31', window = '01 Apr 2026 – 31 Jan 2027' where id = 'pmayg';
update schemes set deadline = '2026-10-16', window = '01 Aug – 16 Oct 2026' where id = 'pmkisan';
update schemes set deadline = '2026-12-15', window = '01 Oct – 15 Dec 2026' where id = 'jbsy';
update schemes set deadline = '2026-10-01', window = '01 Aug – 01 Oct 2026' where id = 'mbaby';
