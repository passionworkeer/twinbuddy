create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  location varchar(100),
  is_travel_plan boolean not null default false,
  trip_date date,
  trip_days integer,
  trip_budget varchar(20),
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  twin_chat_count integer not null default 0,
  visibility varchar(20) not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists twin_chat_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  requester_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid references users(id) on delete set null,
  negotiation_id uuid references negotiations(id) on delete set null,
  status varchar(20) not null default 'queued',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_twin_chat_requests_post_id on twin_chat_requests(post_id);

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
before update on posts
for each row execute function set_updated_at();

drop trigger if exists trg_twin_chat_requests_updated_at on twin_chat_requests;
create trigger trg_twin_chat_requests_updated_at
before update on twin_chat_requests
for each row execute function set_updated_at();
