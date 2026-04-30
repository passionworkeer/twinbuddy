create table if not exists user_verifications (
  user_id uuid primary key references users(id) on delete cascade,
  verification_status varchar(20) not null default 'unverified',
  real_name_encrypted text,
  id_number_encrypted text,
  id_number_tail varchar(6),
  face_vendor varchar(40),
  face_reference_id varchar(100),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trip_reports (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  destination varchar(100) not null,
  depart_date date not null,
  return_date date not null,
  emergency_contact_name_encrypted text,
  emergency_contact_phone_encrypted text,
  emergency_contact_phone_tail varchar(6),
  notification_status varchar(20) not null default 'pending',
  report_status varchar(20) not null default 'reported',
  sms_vendor varchar(40),
  sms_request_id varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action varchar(60) not null,
  target_type varchar(40),
  target_id varchar(100),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_verifications_status on user_verifications(verification_status);
create index if not exists idx_trip_reports_user_a on trip_reports(user_a_id);
create index if not exists idx_trip_reports_user_b on trip_reports(user_b_id);
create index if not exists idx_audit_logs_action on audit_logs(action);

drop trigger if exists trg_user_verifications_updated_at on user_verifications;
create trigger trg_user_verifications_updated_at
before update on user_verifications
for each row execute function set_updated_at();

drop trigger if exists trg_trip_reports_updated_at on trip_reports;
create trigger trg_trip_reports_updated_at
before update on trip_reports
for each row execute function set_updated_at();
