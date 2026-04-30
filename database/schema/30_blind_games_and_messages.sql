create table if not exists blind_games (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references negotiations(id) on delete cascade,
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  user_a_choices jsonb not null default '{}'::jsonb,
  user_b_choices jsonb not null default '{}'::jsonb,
  per_round_result jsonb not null default '[]'::jsonb,
  user_a_decision varchar(20),
  user_b_decision varchar(20),
  match_score numeric(5,2),
  analysis text,
  state varchar(20) not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references negotiations(id) on delete set null,
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  room_status varchar(20) not null default 'active',
  last_message_preview text,
  unread_count_a integer not null default 0,
  unread_count_b integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  message_type varchar(20) not null default 'text',
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_blind_games_negotiation_id on blind_games(negotiation_id);
create index if not exists idx_conversations_user_a_id on conversations(user_a_id);
create index if not exists idx_conversations_user_b_id on conversations(user_b_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at desc);

drop trigger if exists trg_blind_games_updated_at on blind_games;
create trigger trg_blind_games_updated_at
before update on blind_games
for each row execute function set_updated_at();

drop trigger if exists trg_conversations_updated_at on conversations;
create trigger trg_conversations_updated_at
before update on conversations
for each row execute function set_updated_at();
