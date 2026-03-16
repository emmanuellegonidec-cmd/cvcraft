-- Jean — Schema Supabase COMPLET v2
-- Copiez-collez dans : Supabase → SQL Editor → Run

-- CVs
create table if not exists public.cvs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Mon CV',
  template text not null default 'classic',
  content text not null default '',
  form_data jsonb not null default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Offres d'emploi
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  company text not null,
  location text default '',
  job_type text default 'CDI',
  status text default 'to_apply',
  description text default '',
  notes text default '',
  contact_name text default '',
  contact_email text default '',
  applied_at timestamptz,
  interview_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Contacts recruteurs
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text default '',
  company text default '',
  email text default '',
  phone text default '',
  linkedin text default '',
  notes text default '',
  created_at timestamptz default now() not null
);

-- Index
create index if not exists cvs_user_idx on public.cvs(user_id);
create index if not exists jobs_user_idx on public.jobs(user_id);
create index if not exists contacts_user_idx on public.contacts(user_id);

-- RLS
alter table public.cvs enable row level security;
alter table public.jobs enable row level security;
alter table public.contacts enable row level security;

-- CVs policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cvs' and policyname='cvs_all') then
    create policy "cvs_all" on public.cvs using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Jobs policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_all') then
    create policy "jobs_all" on public.jobs using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Contacts policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='contacts' and policyname='contacts_all') then
    create policy "contacts_all" on public.contacts using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='cvs_updated') then
    create trigger cvs_updated before update on public.cvs for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='jobs_updated') then
    create trigger jobs_updated before update on public.jobs for each row execute procedure public.set_updated_at();
  end if;
end $$;
