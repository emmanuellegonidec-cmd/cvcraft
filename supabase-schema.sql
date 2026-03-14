-- ============================================================
-- CVcraft — Schema Supabase
-- Copiez-collez ce SQL dans : Supabase → SQL Editor → Run
-- ============================================================

-- Table des CVs utilisateurs
create table if not exists public.cvs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null default 'Mon CV',
  template    text not null default 'classic',
  content     text not null default '',
  form_data   jsonb not null default '{}',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Index pour accélérer les requêtes par utilisateur
create index if not exists cvs_user_id_idx on public.cvs(user_id);

-- Row Level Security : chaque utilisateur ne voit que ses CVs
alter table public.cvs enable row level security;

create policy "Lecture ses propres CVs"
  on public.cvs for select
  using (auth.uid() = user_id);

create policy "Créer ses CVs"
  on public.cvs for insert
  with check (auth.uid() = user_id);

create policy "Modifier ses CVs"
  on public.cvs for update
  using (auth.uid() = user_id);

create policy "Supprimer ses CVs"
  on public.cvs for delete
  using (auth.uid() = user_id);

-- Mise à jour automatique de updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_cvs_updated
  before update on public.cvs
  for each row execute procedure public.handle_updated_at();
