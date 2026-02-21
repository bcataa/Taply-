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

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Public profiles are readable by everyone" on public.profiles;
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

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- NU mai folosim trigger pe auth.users – cauza erorii "database error saving new account".
-- Profilul se creează din aplicație (register.html face upsert după signUp).
-- Ștergem trigger-ul dacă există, ca signUp să nu mai dea eroare.
drop trigger if exists on_auth_user_created on auth.users;
