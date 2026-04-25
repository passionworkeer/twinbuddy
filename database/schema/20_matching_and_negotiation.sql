create table if not exists buddy_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  candidate_user_id uuid not null references users(id) on delete cascade,
  source varchar(30) not null default 'vector_search',
  hard_filter_snapshot jsonb not null default '{}'::jsonb,
  vector_score numeric(6,3),
  final_score numeric(5,2),
  status varchar(20) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, candidate_user_id)
);

create table if not exists negotiations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  state varchar(30) not null default 'running',
  match_score numeric(5,2),
  consensus jsonb not null default '[]'::jsonb,
  conflicts jsonb not null default '[]'::jsonb,
  radar_chart jsonb not null default '[]'::jsonb,
  summary text,
  report_intro text,
  checkpoint_payload jsonb not null default '{}'::jsonb,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists negotiation_events (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references negotiations(id) on delete cascade,
  event_type varchar(30) not null,
  actor varchar(20) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_buddy_candidates_user_id on buddy_candidates(user_id);
create index if not exists idx_buddy_candidates_status on buddy_candidates(status);
create index if not exists idx_negotiations_user_a on negotiations(user_a_id);
create index if not exists idx_negotiations_user_b on negotiations(user_b_id);
create index if not exists idx_negotiation_events_negotiation_id on negotiation_events(negotiation_id);

drop trigger if exists trg_buddy_candidates_updated_at on buddy_candidates;
create trigger trg_buddy_candidates_updated_at
before update on buddy_candidates
for each row execute function set_updated_at();

drop trigger if exists trg_negotiations_updated_at on negotiations;
create trigger trg_negotiations_updated_at
before update on negotiations
for each row execute function set_updated_at();
