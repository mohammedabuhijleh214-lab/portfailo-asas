# Deployment readiness

## Frontend

1. `npm install && npm run build`
2. Deploy `dist/` (or project root) behind HTTPS
3. Ensure `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `sw.js`, and error pages are published
4. Reverse-proxy `/api` → auth API (`http://127.0.0.1:8787` or internal service)
5. Proxy `/uploads` → API upload static directory

## Backend

1. PostgreSQL available; set `DATABASE_URL`
2. Copy `server/.env.example` → `server/.env`
3. Set production values:
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true` (HTTPS only)
   - `COOKIE_SAME_SITE=lax` (or `strict` if same-site)
   - `CORS_ORIGIN=https://your-domain`
   - `ADMIN_USERNAME` + `ADMIN_PASSWORD` (bootstrap once) or `ADMIN_PASSWORD_HASH`
4. `cd server && npm install && npm start`
5. Optional: `SMTP_*` + `MAIL_TO` for contact email notifications

## Security checklist

- [ ] No `.env` committed
- [ ] HTTPS everywhere
- [ ] `COOKIE_SECURE=true`
- [ ] CORS locked to production origin
- [ ] CSP meta present on HTML
- [ ] Admin credentials only in env / DB hash
- [ ] Backups for PostgreSQL (`pg_dump`) scheduled

## Cache

- Static assets: long-cache + fingerprinted builds when possible
- Auth/session endpoints: `Cache-Control: no-store` (set on login/session)
- Uploads: short public cache (API already sets 1 day)

## Smoke test

1. Home loads EN/AR
2. Contact form submits (API up)
3. Admin login via API only
4. Offline page via SW
5. 404 page reachable
