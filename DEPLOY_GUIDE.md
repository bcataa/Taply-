# Deploy & Fix "Access supabase.co" in Google Login

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
