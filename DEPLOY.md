# Pași pentru publicarea Taply

Ghid scurt pentru a pune site-ul online (production).

---

## 1. Pregătire locală

- **Nu pune niciodată `.env` în git** – e deja în `.gitignore`.
- Asigură-te că ai un fișier **`.env`** (copiat din `.env.example`) cu:
  - `SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY` (dacă folosești Supabase)
  - Opțional: `PORT=8001`, `PASSWORD_SALT=un_string_secret_lung` (recomandat pe producție pentru parole).

---

## 2. Alegerea hosting-ului

Taply are nevoie de:

- **Node.js** (serverul din `server.js`)
- **HTTPS** (obligatoriu pentru auth și încredere)
- **Variabile de mediu** (`.env` sau setate în panoul de hosting)

### Opțiuni comune

| Serviciu | Ce faci |
|----------|--------|
| **Railway** | Conectezi repo-ul Git, setezi env vars, deploy. Portul vine din `process.env.PORT`. |
| **Render** | Web Service, build: nu e nevoie, start: `node server.js`, env vars în dashboard. |
| **Fly.io** | `fly launch`, adaugi secrets pentru SUPABASE_*, `fly deploy`. |
| **VPS (DigitalOcean, etc.)** | Instalezi Node, clonezi proiectul, rulezi `node server.js` cu **pm2** sau **systemd**, pui **Nginx** în față cu SSL (Let's Encrypt). |

### Vercel – merge?

**Nu direct.** Vercel e **serverless**: rulează funcții per request, nu un server Node care stă mereu pornit. Taply are un server Express care:

- ascultă pe un port și servește fișiere + API;
- scrie în `data/users.json` (înregistrări / login local).

Pe Vercel nu poți rula un astfel de server continuu, iar fișierele scrise nu sunt persistente (fiecare request poate fi pe alt container).

**Vercel merge doar dacă**:
- folosești **doar Supabase** pentru conturi și profiluri (fără login/register pe server cu `users.json`);
- refactorizezi API-ul în **Serverless Functions** (ex. `api/profile/[username].js`) și folosești doar Supabase.

Dacă vrei zero refactor și setup rapid, folosește **Railway**, **Render** sau **Fly.io** – toate suportă un server Node care rulează continuu și pot folosi `.env` pentru Supabase.

---

## 3. Publicare pe Railway (recomandat – foarte simplu)

Railway e foarte ușor: conectezi un repo Git, pui variabilele de mediu și în câteva minute ai site-ul live, cu HTTPS inclus.

1. **Cont**  
   Mergi pe [railway.app](https://railway.app), Sign up (cu GitHub e cel mai rapid).

2. **Proiect nou**  
   **New Project** → **Deploy from GitHub repo**.  
   Autorizează Railway să vadă repo-ul tău, apoi alege repository-ul Taply (dacă nu e pe GitHub, pune mai întâi codul pe GitHub).

3. **Setări proiect**  
   Railway detectează Node.js. Dacă întreabă:
   - **Build Command**: poți lăsa gol sau `npm install`.
   - **Start Command**: `npm start` sau `node server.js`.  
   **Root Directory**: lasă gol dacă proiectul e în rădăcina repo-ului.

4. **Variabile de mediu**  
   În proiectul tău pe Railway: **Variables** (sau **Settings** → Variables). Adaugă:
   - `SUPABASE_URL` = URL-ul din Supabase (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` = cheia Service Role din același loc  
   (fără ghilimele, doar valoarea)

5. **Deploy**  
   La primul deploy se pornește singur. La fiecare **push** pe branch-ul conectat, Railway reface deploy automat.

6. **Domeniu**  
   În **Settings** → **Networking** → **Generate Domain**. Primești un URL de tip `taply-production.up.railway.app`.  
   Pentru domeniu propriu (ex. taply.ro): **Custom Domain** → adaugi domeniul și urmezi instrucțiunile (CNAME către URL-ul Railway). HTTPS se activează automat.

7. **Supabase**  
   În Supabase → **Authentication** → **URL Configuration**:  
   - **Site URL**: `https://domeniul-tau.ro` (sau URL-ul generat de Railway)  
   - **Redirect URLs**: adaugă `https://domeniul-tau.ro/index.html`, `https://domeniul-tau.ro/register.html`, `https://domeniul-tau.ro/login.html`

Gata. Deschizi `https://domeniul-tau.ro/landing.html` și testezi înregistrarea.

---

## 4. Pași generali (orice hosting)

1. **Încarcă codul**  
   - Fie push pe Git și conectare la serviciu (Railway, Render, Fly),  
   - Fie upload manual (FTP/SFTP) pe VPS.

2. **Setează variabilele de mediu**  
   În panoul de hosting (env / secrets) adaugă:
   - `SUPABASE_URL` = URL-ul proiectului tău Supabase  
   - `SUPABASE_SERVICE_ROLE_KEY` = cheia Service Role (din Supabase → Project Settings → API)  
   - Opțional: `PORT` (mulți hosting-uri îl setează automat)  
   - Opțional: `PASSWORD_SALT` = un string lung și random (doar pentru modul cu conturi locale, dacă îl folosești)

3. **Build & start**  
   - Nu e nevoie de build.  
   - Comanda de start: **`npm start`** sau **`node server.js`**.  
   - Serverul ascultă pe `process.env.PORT || 8001`.

4. **Domeniu**  
   - Legă domeniul tău (ex. `taply.ro`) de aplicație în panoul de hosting.  
   - Activează **HTTPS** (certificat SSL) – majoritatea serviciilor o fac automat.

---

## 5. Supabase (dacă îl folosești)

- În **Supabase Dashboard** → **Authentication** → **URL Configuration**:
  - **Site URL**: `https://domeniul-tau.ro`
  - **Redirect URLs**: adaugă `https://domeniul-tau.ro/index.html`, `https://domeniul-tau.ro/register.html`, etc.
- În **supabase-config.js** (sau într-un build pe server) URL-ul și `anonKey` trebuie să fie cele ale proiectului tău; dacă ai un singur proiect, de obicei sunt deja corecte.

---

## 6. După publicare – verificări

- Deschide `https://domeniul-tau.ro/landing.html` – trebuie să se încarce fără mesaje de tip „Start the server” sau „opened from file”.
- Încearcă **Sign up** și **Log in** (email sau Google dacă e configurat).
- Deschide un profil public: `https://domeniul-tau.ro/profile.html?u=username`.
- Verifică că link-ul din dashboard („Copy link”) folosește domeniul real – aplicația îl ia din `window.location.origin`.

---

## 7. Dacă folosești alt domeniu decât taply.ro

- **Register / text „Your link”**: domeniul se completează automat din URL (host).  
- **Username step (index)**: prefixul (ex. `https://domeniul-tau.ro/`) se ia din `window.location.origin`.  
- Dacă undeva mai apare text fix „taply.ro”, poți căuta în proiect „taply.ro” și înlocui cu domeniul tău.

---

## Rezumat rapid

1. Pregătește `.env` (fără să-l pui în git).  
2. Alege un hosting cu Node.js și HTTPS.  
3. Încarcă codul și setează env vars (`SUPABASE_*`, opțional `PORT`, `PASSWORD_SALT`).  
4. Start: `npm start` sau `node server.js`.  
5. Leagă domeniul și SSL.  
6. Configurează Supabase redirect URLs pentru noul domeniu.  
7. Testează înregistrare, login și profil public.

Gata – Taply e gata de publicare.
