-- Session History Tables for Planning Poker
-- Run this in Supabase Dashboard > SQL Editor

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text not null,
  name text not null default 'Untitled Session',
  host_name text not null,
  host_email text,
  series_key text not null default 'fibonacci',
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  ended_at timestamptz default now(),
  total_points numeric default 0
);

-- Issues estimated in each session
create table if not exists session_issues (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  issue_key text not null,
  summary text not null,
  source text not null default 'custom',
  estimate text,
  votes jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Participants who joined
create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  is_host boolean default false,
  joined_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_sessions_host_email on sessions(host_email);
create index if not exists idx_sessions_created_at on sessions(created_at desc);
create index if not exists idx_session_issues_session_id on session_issues(session_id);
create index if not exists idx_session_participants_session_id on session_participants(session_id);
