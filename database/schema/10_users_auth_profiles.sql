create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname varchar(40) not null,
  phone varchar(20) unique,
  password_hash text,
  avatar_url text,
  city varchar(40),
  mbti varchar(6),
  status varchar(20) not null default 'active',
  auth_provider varchar(20) not null default 'phone',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  travel_range jsonb not null default '[]'::jsonb,
  budget varchar(20),
  self_desc varchar(120),
  style_vector jsonb not null default '{}'::jsonb,
  personality_tags jsonb not null default '[]'::jsonb,
  preferred_destinations jsonb not null default '[]'::jsonb,
  dietary_preferences jsonb not null default '[]'::jsonb,
  dealbreakers jsonb not null default '[]'::jsonb,
  active_mode varchar(20) not null default 'standard',
  completeness_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  access_token_hash text not null,
  refresh_token_hash text,
  expires_at timestamptz not null,
  device_label varchar(80),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_phone on users(phone);
create index if not exists idx_users_city on users(city);
create index if not exists idx_users_mbti on users(mbti);
create index if not exists idx_auth_sessions_user_id on auth_sessions(user_id);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on user_profiles;
create trigger trg_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();
