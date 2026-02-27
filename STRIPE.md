# Stripe – Premium (4 €/lună)

## Variabile de mediu (.env)

- **STRIPE_SECRET_KEY** – cheia secretă Stripe (Dashboard → Developers → API keys).
- **STRIPE_PRICE_ID_PREMIUM** – ID-ul prețului pentru abonamentul Premium (4 €/lună).
- **STRIPE_WEBHOOK_SECRET** – signing secret al webhook-ului (după ce creezi endpoint-ul).
- **SUPABASE_JWT_SECRET** – JWT Secret din Supabase (Settings → API → JWT Secret), folosit pentru a verifica token-ul la `POST /api/create-checkout-session`.
- **BASE_URL** (opțional) – URL-ul public al app-ului (ex: `https://www.slebb.com`). Dacă lipsește, se folosește `req.protocol + host`.

## Stripe Dashboard

1. **Produs și preț**
   - Products → Add product: nume „Premium”, preț **4 €** recurent (monthly).
   - Copiază **Price ID** (ex: `price_xxx`) în `STRIPE_PRICE_ID_PREMIUM`.

2. **Webhook**
   - Developers → Webhooks → Add endpoint.
   - URL: `https://<domeniul-tau>/api/stripe-webhook`.
   - Events: `checkout.session.completed`.
   - După creare, copiază **Signing secret** (whsec_xxx) în `STRIPE_WEBHOOK_SECRET`.

## Flux

- Utilizatorul apasă „Upgrade to Premium” pe `/premium` (trebuie să fie logat cu Supabase).
- Frontend apelează `POST /api/create-checkout-session` cu header `Authorization: Bearer <access_token>`.
- Serverul creează o Stripe Checkout Session (subscription) și returnează `{ url }`.
- Utilizatorul e redirecționat la Stripe Checkout; după plată Stripe trimite evenimentul la webhook.
- Webhook-ul actualizează `profiles.plan = 'premium'` pentru `id = client_reference_id` (Supabase user id).

## Deploy (Railway sau alt host)

**„Payment is not configured”** apare dacă variabilele Stripe nu sunt setate pe server. În **Railway** (sau unde rulează app-ul):

1. Proiect → **Variables**.
2. Adaugă (cu valorile din `.env` local):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_PREMIUM`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_JWT_SECRET`
   - `BASE_URL` (ex. `https://www.slebb.com`)
3. **Redeploy** ca variabilele să se încarce.

Fără aceste variabile pe server, butonul „Upgrade to Premium” returnează „Payment is not configured.”

## Notă

Fără Supabase (doar auth local cu users.json), Stripe nu e folosit: butonul pe `/premium` afișează un mesaj că Premium e disponibil doar cu Supabase.
