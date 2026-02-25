# Deploy & Fix "Access supabase.co" in Google Login

## 0. Conectează domeniul tău (ex. taply.ro)

Dacă ai deja Taply pe Railway și ai obținut un domeniu:

### Pasul 1: Adaugă domeniul în Railway

1. Mergi pe [railway.app](https://railway.app) → proiectul Taply.
2. **Settings** → **Networking** → **Custom Domain**.
3. Adaugă domeniul: `taply.ro` (sau domeniul tău).
4. Adaugă și `www.taply.ro` dacă vrei să funcționeze și cu www.
5. Railway îți va arăta ce înregistrări DNS trebuie să adaugi.

### Pasul 2: Configurează DNS-ul

La provider-ul de domeniu (GoDaddy, Namecheap, Cloudflare, etc.):

| Tip  | Name/Host | Value/Target |
|------|-----------|--------------|
| CNAME | `www` | `taply-production.up.railway.app` |
| A     | `@` (sau root) | IP-ul indicat de Railway, sau folosește CNAME `@` → `taply-production.up.railway.app` dacă e posibil |

> **Notă:** Unii provideri nu permit CNAME pe root (`@`). În acest caz, folosește un **ANAME/ALIAS** (dacă există) sau **A record** cu IP-ul Railway. Railway afișează exact ce ai nevoie în panoul Custom Domain.

### Pasul 3: Actualizează Supabase (obligatoriu pentru link din email)

În **Supabase** → **Authentication** → **URL Configuration**:

- **Site URL**: pune exact noul tău domeniu/subdomeniu, ex. `https://taply.ro` sau `https://app.taply.ro` (link-ul din emailul de confirmare folosește această bază).
- **Redirect URLs** – adaugă toate variantele pe care le folosești:
  - `https://taply.ro/**`
  - `https://taply.ro/confirm-email.html`
  - `https://taply.ro/dashboard`
  - `https://taply.ro/login`
  - `https://taply.ro/register`
  - Dacă ai schimbat subdomeniul (ex. app.taply.ro), adaugă și pentru el:
    - `https://app.taply.ro/**`
    - `https://app.taply.ro/confirm-email.html`
  - `https://www.taply.ro/**` (dacă folosești www)

**După ce schimbi subdomeniul:** actualizează **Site URL** la noul URL (ex. `https://app.taply.ro`) și adaugă în **Redirect URLs** noul domeniu + `/confirm-email.html`. Altfel link-ul din email duce încă la vechiul domeniu și poate să nu meargă.

### Pasul 4: Google OAuth (dacă folosești login cu Google)

În **Google Cloud Console** → **APIs & Services** → **Credentials** → OAuth client:

- **Authorized JavaScript origins**: `https://taply.ro`, `https://www.taply.ro`
- **Authorized redirect URIs**: adaugă `https://taply.ro` (Supabase gestionează callback-ul)

### Pasul 5: (Opțional) Subdomenii – www + username.domeniu

Pentru ca **tot** să meargă cu **www** și **subdomeniile** (ex. username.slebb.com) să afișeze profilul:

1. **Custom domain** pe Railway: `www.slebb.com` (sau www.taply.ro).
2. **Variables** pe Railway: `SUBDOMAIN_DOMAIN=slebb.com` (doar domeniul, fără www).
3. **DNS** la GoDaddy (sau alt furnizor):
   - **CNAME** `www` → `xxx.up.railway.app` (pentru www)
   - **CNAME** `*` (wildcard) → `xxx.up.railway.app` (pentru *.slebb.com)
4. Redeploy.

Rezultat: **www.slebb.com** = site (login, dashboard, landing); **username.slebb.com** = profil public. Dacă intri pe un subdomeniu și dai pe Login/Dashboard, ești redirecționat la **www.slebb.com**.

---

## Link din emailul de confirmare nu merge (după schimbare subdomeniu)

Dacă ai schimbat subdomeniul (ex. de la `taply.ro` la `app.taply.ro`) și link-ul din emailul „Confirm your email” nu mai deschide site-ul corect:

1. **Supabase** → **Authentication** → **URL Configuration**
2. **Site URL** – pune noul URL, ex. `https://app.taply.ro` (fără slash la final)
3. **Redirect URLs** – adaugă:
   - `https://app.taply.ro/**`
   - `https://app.taply.ro/confirm-email.html`

Salvează. Link-urile din emailurile noi vor folosi deja noul domeniu. (Emailurile deja trimise vor avea în continuare vechiul link – utilizatorii pot cere „Resend confirmation” sau să se înregistreze din nou.)

---

## 1. Deploy to Railway (free tier)

1. Push your code to **GitHub**.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
3. Select your Taply repo.
4. In **Variables**, add:
   - `SUPABASE_URL` = your Supabase project URL (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` = your Service Role key
5. **Settings** → **Networking** → **Generate Domain** (you get `yourapp.up.railway.app`).
6. In **Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://yourapp.up.railway.app`
   - **Redirect URLs**: add `https://yourapp.up.railway.app/dashboard`, `/login`, `/register`

7. In **Google Cloud Console** → **APIs & Services** → **Credentials** → your OAuth client:
   - **Authorized redirect URIs**: add `https://yourapp.up.railway.app` (Supabase handles the rest via its callback)

Your profile will be visible at `https://yourapp.up.railway.app/username`.

---

## 2. Change "Access jumrmvpeyayyloifxgh.supabase.co" to your domain

When users log in with Google, they see **"Access [your-project].supabase.co"** because Supabase handles OAuth. To show your own domain instead (e.g. **"Access auth.taply.ro"**):

### Option A: Supabase Custom Domain (recommended, paid)

Supabase Custom Domains are a **paid add-on** (Pro plan or higher).

1. In **Supabase Dashboard** → **Project Settings** → **Custom Domains** (or [Add-ons](https://supabase.com/dashboard/project/_/settings/addons?panel=customDomain)).
2. Add a subdomain like `auth.taply.ro` (must be a subdomain, not root).
3. Add a **CNAME** in your DNS: `auth.taply.ro` → `jumrmvpeyayyloifxgh.supabase.co`
4. Add the **TXT** verification record Supabase gives you.
5. After activation, update **supabase-config.js** and your `.env`:
   - `SUPABASE_URL` = `https://auth.taply.ro`
6. In **Google Cloud Console** → OAuth client → **Authorized redirect URIs**:
   - Add `https://auth.taply.ro/auth/v1/callback`
   - Keep the old `https://jumrmvpeyayyloifxgh.supabase.co/auth/v1/callback` until you switch

Then Google will show **"Access auth.taply.ro"** instead of the random Supabase URL.

### Option B: Vanity subdomain (still shows supabase.co)

If you're on **Supabase Pro**, you can get a nicer subdomain like `taply-auth.supabase.co` instead of `jumrmvpeyayyloifxgh.supabase.co`:

```bash
supabase vanity-subdomains --project-ref YOUR_PROJECT_REF check-availability --desired-subdomain taply-auth --experimental
supabase vanity-subdomains --project-ref YOUR_PROJECT_REF activate --desired-subdomain taply-auth --experimental
```

Google would then show **"Access taply-auth.supabase.co"**.

### Option C: Free plan – no change

On the free plan you keep `jumrmvpeyayyloifxgh.supabase.co`. It works, but users see that domain during login. Many apps ship like this; upgrade to Pro + Custom Domain when you want a branded login.
