# Ce faci ca Taply să fie public și să meargă

După ce merge local, urmezi pașii de mai jos. (Detalii în **DEPLOY.md** și **SUPABASE_SETUP.md**.)

---

## 1. Pune codul pe GitHub

1. Creează un repo nou pe [github.com](https://github.com) (ex. `taply`).
2. În folderul proiectului Taply:
   ```bash
   git init
   git add .
   git commit -m "Taply initial"
   git branch -M main
   git remote add origin https://github.com/NUMELE_TAU/taply.git
   git push -u origin main
   ```
   (Înlocuiește `NUMELE_TAU/taply` cu user/repo-ul tău.)

---

## 2. Deploy pe Railway

1. Mergi pe [railway.app](https://railway.app) și fă Sign up (cu GitHub).
2. **New Project** → **Deploy from GitHub repo** → alege repo-ul Taply.
3. **Variables** (în proiectul Railway): adaugă:
   - `SUPABASE_URL` = din Supabase → Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = din același loc → service_role key (secret)
4. **Settings** → **Networking** → **Generate Domain**. Vei avea un URL de tip `taply-xxx.up.railway.app`.
5. La fiecare push pe `main`, Railway face deploy automat.

---

## 3. Setează URL-urile în Supabase (obligatoriu)

Dacă nu faci asta, Google login și reset parolă vor duce la localhost și nu vor merge.

1. **Supabase** → **Authentication** → **URL Configuration**.
2. **Site URL**: pune URL-ul live, **fără** slash la final, ex.:
   - `https://taply-xxx.up.railway.app`  
   - sau domeniul tău: `https://taply.ro`
3. **Redirect URLs** – adaugă (și pentru domeniu custom dacă ai):
   - `https://taply-xxx.up.railway.app/**`
   - `https://taply-xxx.up.railway.app/dashboard`
   - `https://taply-xxx.up.railway.app/login`
   - `https://taply-xxx.up.railway.app/register`
   - Dacă ai domeniu propriu: `https://taply.ro/**` etc.
4. **Save**.

---

## 4. Verifică package.json (start)

În proiect trebuie să existe un script de start. Deschide **package.json** și asigură-te că ai:

```json
"scripts": {
  "start": "node server.js"
}
```

Dacă lipsește, adaugă-l. Railway pornește cu `npm start`.

---

## 5. Testează site-ul live

1. Deschide `https://taply-xxx.up.railway.app/landing` (sau domeniul tău).
2. **Sign up** cu email + parolă sau **Continue with Google**.
3. După login ar trebui să ajungi la **dashboard** (profil, linkuri).
4. Deschide linkul tău public: `https://taply-xxx.up.railway.app/username` – trebuie să se încarce profilul.

---

## 6. (Opțional) Domeniu propriu (ex. taply.ro)

1. În Railway: **Settings** → **Networking** → **Custom Domain** → adaugi `taply.ro`.
2. La provider-ul de domeniu (unde ai cumpărat taply.ro): creezi un **CNAME**: `www` (sau `@`) → `taply-xxx.up.railway.app` (URL-ul generat de Railway).
3. În Supabase la **URL Configuration** adaugi și `https://taply.ro` la **Site URL** și la **Redirect URLs** (`https://taply.ro/**`, `https://taply.ro/dashboard`, etc.).

---

## Rezumat

| Pas | Ce faci |
|-----|--------|
| 1 | Cod pe GitHub |
| 2 | Railway: deploy from GitHub + Variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) + Generate Domain |
| 3 | Supabase: Site URL + Redirect URLs = URL-ul live |
| 4 | package.json: `"start": "node server.js"` |
| 5 | Test: landing → sign up / Google → dashboard → link public |

După acești pași, Taply e public și ar trebui să meargă înregistrarea, login-ul (inclusiv Google) și linkurile de profil.
