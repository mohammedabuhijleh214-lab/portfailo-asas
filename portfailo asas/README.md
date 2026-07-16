# Cyber Warden

Freelance portfolio for **Mohammed Abu Hijleh**.

## Run locally

1. **Frontend** — serve the project root over HTTP (e.g. port 5173)
2. **API** (required for admin login + contact + uploads):

```bash
cd server
cp .env.example .env
# Set DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD (never commit .env)
# Set CORS_ORIGIN to your frontend origin
npm install
npm start
```

Auth flow: **Frontend → Express → Argon2id → PostgreSQL → HTTP-only Secure Session Cookie**

No demo passwords. Credentials exist only in `server/.env` / the hashed `users` table.

## Production build

```bash
npm install
npm run build
# Deploy dist/; reverse-proxy /api → API server; serve /uploads from API
```

## What’s included

- Production auth + contact API (CSRF, rate limits, Helmet, CORS)
- Admin CMS: image upload, drag-drop service order, preview, undo/redo, autosave
- EN / AR i18n across UI, terminal, dashboard, forms
- SEO: Open Graph, Twitter Cards, JSON-LD, sitemap.xml, robots.txt
- PWA: service worker, offline page, install prompt, update detection
- Error pages: 404, 403, 500, offline

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for production env, proxy, cookies, caches, and smoke tests.

## Contact

- mohammedabuhijleh214@gmail.com
- 0779822292
- https://github.com/mohammedabuhijleh214-lab

© Cyber Warden / Mohammed Abu Hijleh
