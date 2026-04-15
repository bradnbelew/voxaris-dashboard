-- ============================================================
-- Voxaris Dashboard — Supabase Schema
-- Run this in the Supabase SQL editor. Safe to re-run.
-- ============================================================

-- ─── Helper: auto-update updated_at ─────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── organizations ───────────────────────────────────────────
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  company_name text,
  primary_color text default '#ff6363',
  notification_email text,
  plan text not null default 'starter' check (plan in ('starter','growth','enterprise')),
  monthly_interview_limit integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists organizations_updated_at on organizations;
create trigger organizations_updated_at
  before update on organizations
  for each row execute procedure update_updated_at_column();

-- ─── profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'recruiter' check (role in ('super_admin','admin','recruiter','viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- ─── client_tokens ───────────────────────────────────────────
create table if not exists client_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  organization_id uuid not null references organizations(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── roles ───────────────────────────────────────────────────
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  pay_range text,
  shift text,
  venue_type text,
  behavioral_questions text[] not null default '{}',
  must_haves text[] not null default '{}',
  certifications_preferred text[] not null default '{}',
  active boolean not null default true,
  interview_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roles_org_id_idx on roles (organization_id);
create index if not exists roles_active_idx on roles (organization_id, active);

drop trigger if exists roles_updated_at on roles;
create trigger roles_updated_at
  before update on roles
  for each row execute procedure update_updated_at_column();

-- ─── candidates ──────────────────────────────────────────────
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  resume_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index if not exists candidates_org_id_idx on candidates (organization_id);
create index if not exists candidates_email_idx on candidates (organization_id, email);

drop trigger if exists candidates_updated_at on candidates;
create trigger candidates_updated_at
  before update on candidates
  for each row execute procedure update_updated_at_column();

-- ─── interviews ──────────────────────────────────────────────
create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references candidates(id),
  conversation_id text not null unique,
  role_id uuid references roles(id),
  applied_role text not null default 'general',
  source text not null default 'video_interview',
  status text not null default 'active' check (status in ('active','completed','disqualified','ended','error')),
  pipeline_status text not null default 'pending_review' check (pipeline_status in ('pending_review','reviewed','shortlisted','rejected','hired')),
  disqualified boolean not null default false,
  disqualification_reason text,
  work_authorized boolean,
  years_experience text,
  venue_type text,
  most_recent_employer text,
  has_certification boolean,
  certifications text[],
  available_evenings boolean,
  available_weekends boolean,
  earliest_start_date text,
  confirmed_physical boolean,
  candidate_questions text[],
  recruiter_call_scheduled boolean not null default false,
  preferred_callback_time text,
  consent_given boolean not null default false,
  consent_timestamp text,
  bipa_consent boolean not null default false,
  objectives_completed text[] not null default '{}',
  last_objective text,
  perception_analysis jsonb,
  perception_signals jsonb not null default '[]',
  engagement_score integer,
  professional_score integer,
  eye_contact_pct integer,
  ai_summary text,
  ai_strengths text[],
  ai_concerns text[],
  ai_fit_score integer,
  ai_recommendation text check (ai_recommendation in ('strong_yes','yes','maybe','no')),
  transcript jsonb,
  transcript_summary text,
  recording_url text,
  recording_s3_key text,
  guardrail_events jsonb not null default '[]',
  event_log jsonb not null default '[]',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  ended_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_org_id_idx on interviews (organization_id);
create index if not exists interviews_conversation_id_idx on interviews (conversation_id);
create index if not exists interviews_pipeline_status_idx on interviews (organization_id, pipeline_status);
create index if not exists interviews_role_id_idx on interviews (role_id);
create index if not exists interviews_started_at_idx on interviews (organization_id, started_at desc);

drop trigger if exists interviews_updated_at on interviews;
create trigger interviews_updated_at
  before update on interviews
  for each row execute procedure update_updated_at_column();

-- ─── interview_notes ─────────────────────────────────────────
create table if not exists interview_notes (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  author_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists interview_notes_interview_id_idx on interview_notes (interview_id);

-- ─── usage_events ────────────────────────────────────────────
create table if not exists usage_events (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type text not null default 'interview_created',
  interview_id uuid references interviews(id),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_org_month_idx on usage_events (organization_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table client_tokens enable row level security;
alter table roles enable row level security;
alter table candidates enable row level security;
alter table interviews enable row level security;
alter table interview_notes enable row level security;
alter table usage_events enable row level security;

-- profiles: user can read/update their own row
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- organizations: org members can read their org
drop policy if exists "organizations_select_member" on organizations;
create policy "organizations_select_member" on organizations
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = organizations.id
    )
  );

-- client_tokens: org members can read their own tokens
drop policy if exists "client_tokens_select_member" on client_tokens;
create policy "client_tokens_select_member" on client_tokens
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = client_tokens.organization_id
    )
  );

-- roles
drop policy if exists "roles_select_member" on roles;
create policy "roles_select_member" on roles
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = roles.organization_id
    )
  );

drop policy if exists "roles_insert_member" on roles;
create policy "roles_insert_member" on roles
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = roles.organization_id
    )
  );

drop policy if exists "roles_update_member" on roles;
create policy "roles_update_member" on roles
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = roles.organization_id
    )
  );

-- candidates
drop policy if exists "candidates_select_member" on candidates;
create policy "candidates_select_member" on candidates
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = candidates.organization_id
    )
  );

drop policy if exists "candidates_insert_member" on candidates;
create policy "candidates_insert_member" on candidates
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = candidates.organization_id
    )
  );

drop policy if exists "candidates_update_member" on candidates;
create policy "candidates_update_member" on candidates
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = candidates.organization_id
    )
  );

-- interviews
drop policy if exists "interviews_select_member" on interviews;
create policy "interviews_select_member" on interviews
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interviews.organization_id
    )
  );

drop policy if exists "interviews_insert_member" on interviews;
create policy "interviews_insert_member" on interviews
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interviews.organization_id
    )
  );

drop policy if exists "interviews_update_member" on interviews;
create policy "interviews_update_member" on interviews
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interviews.organization_id
    )
  );

-- interview_notes
drop policy if exists "interview_notes_select_member" on interview_notes;
create policy "interview_notes_select_member" on interview_notes
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interview_notes.organization_id
    )
  );

drop policy if exists "interview_notes_insert_member" on interview_notes;
create policy "interview_notes_insert_member" on interview_notes
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interview_notes.organization_id
    )
  );

drop policy if exists "interview_notes_update_member" on interview_notes;
create policy "interview_notes_update_member" on interview_notes
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = interview_notes.organization_id
    )
  );

-- usage_events
drop policy if exists "usage_events_select_member" on usage_events;
create policy "usage_events_select_member" on usage_events
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = usage_events.organization_id
    )
  );

drop policy if exists "usage_events_insert_member" on usage_events;
create policy "usage_events_insert_member" on usage_events
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = usage_events.organization_id
    )
  );

drop policy if exists "usage_events_update_member" on usage_events;
create policy "usage_events_update_member" on usage_events
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.organization_id = usage_events.organization_id
    )
  );

-- ============================================================
-- Auth trigger — auto-create profile on user signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'organization_id')::uuid,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'recruiter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
