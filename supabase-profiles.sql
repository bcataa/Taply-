-- Copiază DOAR acest conținut în Supabase → SQL Editor → Run

-- Tabelul de profiluri (legat de auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  profile jsonb default '{}',
  analytics jsonb default '{"pageViews":0,"linkClicks":{}}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pentru căutare după username (pagina publică)
create index if not exists profiles_username_lower on public.profiles (lower(username));

-- RLS: utilizatorul autentificat vede/actualizează doar propriul rând
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Citire publică: oricine poate citi orice profil (pentru taply.ro/username)
create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (true);

-- Opțional: trigger pentru updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
