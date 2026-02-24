# Subdomains & Railway (Profile visible for free)

## Profile works for free

On Railway, your profile is visible at:
- **https://yourapp.up.railway.app/username**

No subdomain config needed. It works on the free tier.

## Subdomains (username.yourdomain.com)

For shorter links like **username.taply.ro** instead of **taply.ro/username**:

1. Add a **custom domain** in Railway (e.g. `taply.ro`)
2. In Railway **Variables**, add:
   ```
   SUBDOMAIN_DOMAIN=taply.ro
   ```
3. In your DNS provider, add a **wildcard** record:
   - Type: CNAME
   - Name: `*` (or `*.taply`)
   - Value: your Railway URL (e.g. `yourapp.up.railway.app`)

4. Redeploy.

Then `username.taply.ro` shows that user's profile.

## Railway default domain (up.railway.app)

Railway's default domain (`yourapp.up.railway.app`) does not support app-level subdomains like `username.yourapp.up.railway.app`. Use a custom domain for subdomains.
