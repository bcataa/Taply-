# Configurare Supabase pentru Taply

## 1. Creează un proiect Supabase

1. Mergi la [supabase.com](https://supabase.com) și creează un cont / proiect.
2. În **Project Settings → API** copiază:
   - **Project URL** → îl pui în `supabase-config.js` la `url`
   - **anon public** key → îl pui la `anonKey`

## 2. Actualizează supabase-config.js

Deschide `supabase-config.js` și completează:

```js
window.TaplySupabase = {
  url: "https://PROJECT_REF.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};
```

## 3. Tabelul și politicile în Supabase

În **Supabase Dashboard → SQL Editor** rulează următorul SQL:

```sql
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
```

**Dacă la înregistrare apare eroarea „new row violates row-level security policy”:** rulează în SQL Editor **tot conținutul** din fișierul `supabase-profiles.sql` din proiect (include și trigger-ul care creează automat profilul la signup). Apoi reîncearcă înregistrarea.

## 4. Pagina de profil publică (profile.html) și analytics

Pentru ca **pagina de profil** (link-ul tău taply.ro/username sau profile.html?u=username) să se încarce cu setările din Supabase, serverul trebuie să aibă acces la Supabase:

1. **Copiază** fișierul `.env.example` ca **`.env`** (în același folder cu server.js).
2. Deschide **`.env`** și completează:
   - **SUPABASE_URL** = același Project URL din supabase-config.js (ex. `https://jumrmvpeyrayylolfxgh.supabase.co`)
   - **SUPABASE_SERVICE_ROLE_KEY** = cheia **service_role** (nu anon) din Supabase → **Project Settings** → **API** → **Project API keys** → **service_role** (ține-o secretă, doar pe server)
3. Salvează `.env` și **repornește serverul** (`./start.sh` sau Taply.command). Serverul citește automat variabilele din `.env`.

Dacă nu există `.env` sau aceste variabile, serverul folosește `data/users.json` și profilul tău (salvat în Supabase) **nu** va apărea pe pagina publică („Profil negăsit” / setările nu se încarcă).

## 5. Auth în Supabase

În **Authentication → Providers** verifică că **Email** este activat (implicit).

- **Fără confirmare email**: În **Authentication → Providers → Email** poți dezactiva „Confirm email” ca utilizatorii să intre direct după înregistrare.
- **Cu confirmare email**: Supabase trimite un link de confirmare; utilizatorul trebuie să dea click înainte de a se putea loga.

### Site URL și Redirect URLs – obligatoriu pentru site-ul live

Dacă folosești site-ul pe **Railway** sau alt domeniu (nu localhost), **trebuie** să setezi în Supabase URL-ul live. Altfel:
- **Login cu Google** după click pe „Continue with Google” te duce la localhost și apare „Conexiune refuzată”.
- **Reset parolă** – linkul din email duce la localhost și nu se deschide.

**Pași (o singură dată):**

1. În **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. **Site URL**: pune **exact** URL-ul site-ului tău live, **fără** slash la final.
   - Exemple: `https://taply-production.up.railway.app` sau `https://taply.ro`
3. **Redirect URLs**: adaugă URL-ul live cu `/**` (permite toate căile de pe domeniu):
   - `https://taply-production.up.railway.app/**`  
   - sau `https://domeniul-tau.ro/**`  
   Dacă ai și domeniu custom pe Railway, adaugă și acel domeniu, ex. `https://taply.ro/**`.
4. Apasă **Save**.

După salvare:
- **Google**: deschide site-ul **live** (nu localhost), apasă „Continue with Google” – după autentificare te întoarce pe site-ul live.
- **Reset parolă**: deschide `https://taply-production.up.railway.app/forgot-password.html` (sau domeniul tău), trimite linkul; emailul va conține un link către site-ul live.

### Cum nu mai ești limitat la email (Resend, gratuit)

Supabase are implicit **2 emailuri pe oră**. Cu **Custom SMTP** (ex. Resend) poți mări limita. Resend are plan gratuit (100 emailuri/zi).

---

**Pas 1 – Cont Resend**

1. Mergi la [resend.com](https://resend.com) și creează cont (Sign up).
2. După login: **API Keys** → **Create API Key** → nume ex. „Taply” → **Add**. Copiază cheia (începe cu `re_...`); o vei folosi ca parolă SMTP.

**Pas 2 – Expeditor (sandbox sau domeniu tău)**

- **Test rapid**: Resend oferă sandbox `onboarding@resend.dev`. La Pas 3 pune **Sender email** = `onboarding@resend.dev` și **Sender name** = `Taply`; poți testa reset parolă / confirmare fără domeniu.
- **Producție**: În Resend → **Domains** → **Add Domain** adaugi domeniul tău (ex. `taply.ro`), pui recordurile DNS pe care ți le arată, apoi la Pas 3 folosești ex. `noreply@taply.ro`.

**Pas 3 – SMTP în Supabase**

1. În **Supabase**: **Project Settings** (roata din stânga jos) → **Authentication** → derulează până la **SMTP Settings**.
2. Activează **Enable Custom SMTP**.
3. Completează:
   - **Sender email**: o adresă de la domeniul tău verificat în Resend (ex. `noreply@domeniul-tau.ro`) sau, dacă Resend o permite, adresa de test.
   - **Sender name**: ex. `Taply`
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: API Key-ul de la Pas 1 (cheia `re_...`)
4. **Save**.

**Pas 4 – Mărește limita de email**

1. În Supabase mergi la **Authentication** → **Rate limits** (în CONFIGURATION din stânga).
2. Găsești **Email sent** (sau similar). Mărește valoarea (ex. **30** sau **100** pe oră).
3. Salvează.

După acești pași, emailurile (reset parolă, confirmare, etc.) ies prin Resend. **Important:** dacă nu mărești **Email sent** la Pas 4, vei vedea în continuare „Prea multe încercări” după câteva trimiteri. În aplicație există un cooldown de 5 minute pe „Ai uitat parola?” ca să nu atingi limita din greșeală.

### Custom SMTP nu trimite / „nu merge” – ce verifici

1. **Unde e SMTP în Supabase**  
   Unele proiecte au: **Project Settings** (roata) → **Authentication** → derulează până la **SMTP Settings**. Altele: **Authentication** (meniu stânga) → **Email** → acolo apar **Sender details** și **SMTP provider settings**. Completează acolo și dă **Save**.

2. **Enable Custom SMTP**  
   Trebuie bifat / activat. Fără asta, Supabase folosește în continuare serverul lor (limita de 2/oră).

3. **Valori exacte pentru Resend**
   - **Host**: `smtp.resend.com` (fără `https://`)
   - **Port**: `465`
   - **Username**: `resend` (literal, lowercase)
   - **Password**: API Key-ul Resend (începe cu `re_...`), fără spații la început/sfârșit, copiat din Resend → API Keys

4. **Sender email**  
   Pentru test fără domeniu: exact `onboarding@resend.dev`. Dacă ai pus altceva (ex. `noreply@...`) fără să ai domeniul verificat în Resend, trimiterea poate eșua.

5. **API Key**  
   În [Resend](https://resend.com) → **API Keys**: dacă ai șters cheia sau ai făcut „Revoke”, creează una nouă și pune-o la **Password** în Supabase.

6. **După ce salvezi**  
   Așteaptă 1–2 minute, apoi încearcă din nou „Ai uitat parola?”. Verifică și în Resend → **Logs** (dacă ai) dacă apare vreo trimitere sau eroare.

7. **Dacă tot nu merge**  
   Încearcă **Port** `587` în loc de `465` (și lasă celelalte la fel). Unele rețele blochează 465.

8. **„Error sending recovery email”**  
   Supabase poate folosi uneori adresa utilizatorului ca expeditor; Resend respinge dacă expeditorul nu e verificat. Fix: în Supabase la **Sender email** pune exact **`onboarding@resend.dev`** (domeniul de test Resend). Dacă folosești alt domeniu, trebuie să îl verifici în Resend → Domains și să folosești o adresă de acel domeniu.

## 6. (Opțional) Login cu Google – ce faci în Google Cloud

Pentru butonul **„Continuă cu Google”** ai nevoie de **Client ID** și **Client Secret** din Google Cloud. Pașii concreti:

1. **În Supabase**  
   Mergi la **Authentication → Providers**, activează **Google** și deschide setările. Acolo vei vedea **Callback URL (for OAuth)** – ex. `https://jumrmvpeyrayylolfxgh.supabase.co/auth/v1/callback`. Copiază acest URL (îl folosești la pasul 3).

2. **În Google Cloud Console** (pagina unde ești acum)  
   - În meniul din stânga (hamburger) apasă **APIs & Services** → **Credentials**.  
   - Dacă nu ai proiect: **Select a project** → **New Project** → nume (ex. „Taply”) → **Create**.  
   - Apasă **+ Create Credentials** → **OAuth client ID**.  
   - Dacă îți cere „Configure consent screen”: alege **External** → completează doar **App name** (ex. Taply) și **User support email** → **Save and Continue** până la final.  
   - La **Application type** alege **Web application**.  
   - La **Authorized redirect URIs** apasă **+ Add URI** și lipește URL-ul de la pasul 1 (cel din Supabase, care se termină cu `/auth/v1/callback`).  
   - **Create**. Copiază **Client ID** și **Client Secret**.

3. **Înapoi în Supabase**  
   La **Authentication → Providers → Google** lipești **Client ID** și **Client Secret** și salvezi.

4. **Redirect URLs în Supabase**  
   Mergi la **Authentication → URL Configuration** → **Redirect URLs** și adaugă:  
   - `http://localhost:8000/dashboard`  
   - `http://localhost:8000/reset-password.html` (pentru „Ai uitat parola?”)  
   - (La deploy: și adresa ta de producție, ex. `https://domeniul-tau.com/index.html` și `https://domeniul-tau.com/reset-password.html`.)

După acești pași, „Continuă cu Google” și fluxul „Ai uitat parola?” (email → link → reset-password.html) funcționează.

---

Gata: după ce ai rulat SQL-ul și ai completat `supabase-config.js`, login-ul și înregistrarea folosesc Supabase. La „Ieșire” din dashboard se folosește `signOut` Supabase.
