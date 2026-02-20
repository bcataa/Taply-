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

-- Trigger: creează automat un rând în profiles când se înregistrează un user (evită eroarea RLS la primul insert)
-- Username e făcut unic cu un sufix din id ca să nu dea eroare "duplicate key" când doi useri au același prefix din email
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  unique_username text;
begin
  base_username := lower(split_part(coalesce(new.email, ''), '@', 1));
  if base_username = '' then base_username := 'user'; end if;
  base_username := regexp_replace(base_username, '[^a-z0-9-_]', '-', 'g');
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  if base_username = '' then base_username := 'user'; end if;
  unique_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  insert into public.profiles (id, username, profile, analytics)
  values (new.id, unique_username, '{}', '{"pageViews":0,"linkClicks":{}}')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pe auth.users (rulează în schema auth)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
