# Cyber Warden Production API

Auth flow: **Frontend → Express → Argon2id → PostgreSQL → HTTP-only Secure Session Cookie**

Credentials live only in `server/.env` (never in HTML/JS/localStorage).

## Setup

1. PostgreSQL running with a database (e.g. `cyber_warden`)
2. Configure env:

```bash
cd server
cp .env.example .env
# Set DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH)
# Set CORS_ORIGIN to your static site origin
npm install
npm start
```

On first boot with an empty `users` table, the API bootstraps the admin from `ADMIN_*` env vars into PostgreSQL (Argon2id). Prefer switching to `ADMIN_PASSWORD_HASH` only after bootstrap.

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/auth/csrf` | — | CSRF token + `cw_csrf` cookie |
| POST | `/api/v1/auth/login` | CSRF | Argon2id verify → new session row → `cw_sid` HttpOnly |
| GET | `/api/v1/auth/session` | cookie | Session check |
| POST | `/api/v1/auth/logout` | cookie | Revoke session |
| POST | `/api/v1/contact` | CSRF + rate limit | Validate → `contact_messages` (+ optional SMTP) |
| POST | `/api/v1/upload` | admin + CSRF | Image upload (jpeg/png/webp/gif) |
| GET | `/api/v1/health` | — | DB ping |
| GET | `/uploads/*` | — | Served uploads (nosniff) |

## Security controls

- Helmet (frame deny, nosniff, HSTS in production)
- Strict CORS (`CORS_ORIGIN` only, credentials)
- CSRF double-submit on mutating routes
- Login + contact + upload rate limits
- Session fixation: fresh token on login; older sessions revoked
- Passwords never leave `.env` / DB hash column
- Upload MIME + size limits; server-generated filenames
