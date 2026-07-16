/**
 * Cyber Warden — Production API
 * Frontend → Express → Argon2id → PostgreSQL → HTTP-only Secure Session Cookie
 *
 * Credentials: server/.env only (ADMIN_* bootstrap + DATABASE_URL)
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { query, getPool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

const app = express();
const PORT = Number(process.env.PORT || 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:5173';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 30 * 60 * 1000);
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || 'false') === 'true';
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
const UPLOAD_MAX_MB = Math.min(5, Math.max(1, Number(process.env.UPLOAD_MAX_MB || 2)));

/** Ephemeral CSRF challenge map: csrfSid → token (bound to cookie) */
const csrfStore = new Map();

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function hashIp(ip) {
  return hashToken(`${ip || 'unknown'}|cw`);
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function setSessionCookie(res, token) {
  res.cookie('cw_sid', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie('cw_sid', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: '/',
  });
}

async function ensureSchema() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (lower(username));
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash CHAR(64) NOT NULL UNIQUE,
      csrf_secret CHAR(64),
      ip_hash CHAR(64),
      user_agent_hash CHAR(64),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS contact_messages (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      budget TEXT,
      message TEXT NOT NULL,
      ip_hash CHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip_hash CHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS security_events (
      id BIGSERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      ip_hash CHAR(64),
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function bootstrapAdmin() {
  const { rows } = await query('SELECT id FROM users WHERE is_active = TRUE LIMIT 1');
  if (rows.length) {
    console.info('[auth] admin user present in PostgreSQL');
    return;
  }

  const username = String(process.env.ADMIN_USERNAME || '').trim();
  let passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
  const plain = String(process.env.ADMIN_PASSWORD || '');

  if (!username) {
    console.error('[auth] No users in DB. Set ADMIN_USERNAME + ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in .env');
    process.exit(1);
  }

  if (!passwordHash) {
    if (plain.length < 8) {
      console.error('[auth] ADMIN_PASSWORD must be at least 8 characters (or provide ADMIN_PASSWORD_HASH)');
      process.exit(1);
    }
    passwordHash = await argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
  }

  await query(
    `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')`,
    [username, passwordHash]
  );
  console.info('[auth] bootstrapped admin into PostgreSQL from .env (password not logged)');
}

async function readSession(req) {
  const raw = req.cookies?.cw_sid;
  if (!raw || typeof raw !== 'string' || raw.length < 32) return null;
  const tokenHash = hashToken(raw);
  const { rows } = await query(
    `SELECT s.id AS session_id, s.expires_at, s.revoked_at,
            u.id AS user_id, u.username, u.role, u.is_active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row || row.revoked_at || !row.is_active) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query(`UPDATE sessions SET revoked_at = NOW() WHERE id = $1`, [row.session_id]);
    return null;
  }
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    role: row.role,
    displayName: row.username,
  };
}

async function requireAuth(req, res, next) {
  try {
    const session = await readSession(req);
    if (!session || session.role !== 'admin') {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
    req.session = session;
    next();
  } catch {
    return res.status(500).json({ ok: false, message: 'Session error' });
  }
}

function requireCsrf(req, res, next) {
  const csrfHeader = String(req.get('X-CSRF-Token') || '');
  const csrfSid = req.cookies?.cw_csrf;
  const expected = csrfSid ? csrfStore.get(csrfSid) : null;
  if (!expected || !csrfHeader || !timingSafeEqual(expected, csrfHeader)) {
    return res.status(403).json({ ok: false, message: 'CSRF validation failed' });
  }
  next();
}

function consumeCsrf(req) {
  const csrfSid = req.cookies?.cw_csrf;
  if (csrfSid) csrfStore.delete(csrfSid);
}

async function logSecurity(eventType, severity, ip, payload = {}) {
  try {
    await query(
      `INSERT INTO security_events (event_type, severity, ip_hash, payload) VALUES ($1, $2, $3, $4)`,
      [eventType, severity, hashIp(ip), JSON.stringify(payload)]
    );
  } catch {
    /* non-fatal */
  }
}

async function logAudit(userId, action, ip, meta = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_user_id, action, meta, ip_hash) VALUES ($1, $2, $3, $4)`,
      [userId || null, action, JSON.stringify(meta), hashIp(ip)]
    );
  } catch {
    /* non-fatal */
  }
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.bin';
      cb(null, `${randomToken(16)}${safeExt}`);
    },
  }),
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('INVALID_TYPE'), ok);
  },
});

let mailer = null;
function getMailer() {
  if (mailer) return mailer;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  mailer = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return mailer;
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  company: z.string().trim().max(120).optional().default(''),
  budget: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(12).max(4000),
  website: z.string().max(0).optional().default(''), // honeypot must be empty
});

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true } : false,
  })
);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || origin === CORS_ORIGIN) return cb(null, true);
      return cb(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Accept'],
  })
);

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many attempts' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many messages. Try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ——— Auth ——— */

app.get('/api/v1/auth/csrf', (req, res) => {
  const token = randomToken(32);
  const sid = req.cookies?.cw_csrf || randomToken(16);
  csrfStore.set(sid, token);
  res.cookie('cw_csrf', sid, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: 60 * 60 * 1000,
    path: '/',
  });
  res.json({ token });
});

app.post('/api/v1/auth/login', loginLimiter, requireCsrf, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const username = String(req.body?.username || '').trim().slice(0, 64);
  const password = String(req.body?.password || '');
  const ip = req.ip;

  if (!username || password.length < 8 || password.length > 128) {
    await logSecurity('login_invalid_format', 'warn', ip);
    return res.status(400).json({ ok: false, message: 'Invalid credentials format' });
  }

  try {
    const { rows } = await query(
      `SELECT id, username, password_hash, role, is_active
       FROM users WHERE lower(username) = lower($1) LIMIT 1`,
      [username]
    );
    const user = rows[0];
    let passOk = false;
    if (user?.is_active) {
      try {
        passOk = await argon2.verify(user.password_hash, password);
      } catch {
        passOk = false;
      }
    } else {
      // burn time even when user missing
      await argon2.hash(password, { type: argon2.argon2id, memoryCost: 8192, timeCost: 1, parallelism: 1 }).catch(() => {});
    }

    if (!user || !user.is_active || !passOk) {
      await delay(250);
      await logSecurity('login_failed', 'warn', ip, { username: username.slice(0, 32) });
      return res.status(401).json({ ok: false, message: 'Authentication failed' });
    }

    // Session fixation: always mint a fresh opaque token
    const sessionToken = randomToken(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await query(
      `INSERT INTO sessions (user_id, token_hash, ip_hash, user_agent_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        hashToken(sessionToken),
        hashIp(ip),
        hashToken(String(req.get('user-agent') || '').slice(0, 200)),
        expiresAt.toISOString(),
      ]
    );

    // Revoke older sessions for this user (single-session policy)
    await query(
      `UPDATE sessions SET revoked_at = NOW()
       WHERE user_id = $1 AND token_hash <> $2 AND revoked_at IS NULL`,
      [user.id, hashToken(sessionToken)]
    );

    setSessionCookie(res, sessionToken);
    consumeCsrf(req);
    await logAudit(user.id, 'login', ip);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[auth] login error');
    return res.status(500).json({ ok: false, message: 'Authentication error' });
  }
});

app.get('/api/v1/auth/session', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const session = await readSession(req);
    if (!session) return res.status(401).json({ authenticated: false });
    return res.json({
      authenticated: true,
      role: session.role,
      displayName: session.displayName,
    });
  } catch {
    return res.status(500).json({ authenticated: false });
  }
});

app.post('/api/v1/auth/logout', async (req, res) => {
  const raw = req.cookies?.cw_sid;
  if (raw) {
    await query(`UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1`, [hashToken(raw)]);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

/* ——— Contact ——— */

app.post('/api/v1/contact', contactLimiter, requireCsrf, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Validation failed' });
  }
  // Honeypot: if website field somehow present non-empty, zod fails; also reject prototype keys
  if (Object.prototype.hasOwnProperty.call(req.body || {}, '__proto__')) {
    return res.status(400).json({ ok: false, message: 'Rejected' });
  }

  const { name, email, company, budget, message } = parsed.data;
  const ip = req.ip;

  try {
    const { rows } = await query(
      `INSERT INTO contact_messages (name, email, company, budget, message, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, email.toLowerCase(), company || null, budget || null, message, hashIp(ip)]
    );

    const transport = getMailer();
    const mailTo = process.env.MAIL_TO;
    if (transport && mailTo) {
      await transport
        .sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: mailTo,
          subject: `[Cyber Warden] Contact from ${name}`,
          text: `From: ${name} <${email}>\nCompany: ${company || '—'}\nBudget: ${budget || '—'}\n\n${message}`,
        })
        .catch(() => {});
    }

    consumeCsrf(req);
    return res.json({ ok: true, id: String(rows[0].id) });
  } catch {
    return res.status(500).json({ ok: false, message: 'Unable to store message' });
  }
});

/* ——— Authenticated upload ——— */

app.post(
  '/api/v1/upload',
  uploadLimiter,
  requireAuth,
  requireCsrf,
  (req, res) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        const msg = err.message === 'INVALID_TYPE' ? 'Invalid image type' : 'Upload failed';
        return res.status(400).json({ ok: false, message: msg });
      }
      if (!req.file) return res.status(400).json({ ok: false, message: 'No file' });

      // Path traversal guard — filename is server-generated
      const safeName = path.basename(req.file.filename);
      if (safeName !== req.file.filename || safeName.includes('..')) {
        return res.status(400).json({ ok: false, message: 'Invalid filename' });
      }

      await logAudit(req.session.userId, 'upload', req.ip, { file: safeName });
      consumeCsrf(req);
      return res.json({
        ok: true,
        url: `/uploads/${safeName}`,
      });
    });
  }
);

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);

app.get('/api/v1/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: true, db: false });
  }
});

/* Error pages when API also serves static (optional) */
app.get('/api/v1/admin/messages', requireAuth, async (_req, res) => {
  const { rows } = await query(
    `SELECT id, name, email, company, budget, left(message, 200) AS preview, created_at
     FROM contact_messages ORDER BY created_at DESC LIMIT 50`
  );
  res.json({ ok: true, messages: rows });
});

// CORS error handler
app.use((err, _req, res, next) => {
  if (err?.message === 'CORS blocked') {
    return res.status(403).json({ ok: false, message: 'Origin not allowed' });
  }
  next(err);
});

async function start() {
  try {
    getPool();
    await ensureSchema();
    await bootstrapAdmin();
  } catch (err) {
    console.error('[boot] PostgreSQL required:', err.message);
    console.error('[boot] Set DATABASE_URL in server/.env and ensure Postgres is running.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.info(`[api] http://127.0.0.1:${PORT}`);
    console.info(`[api] CORS: ${CORS_ORIGIN}`);
    console.info('[api] Auth: Express → Argon2id → PostgreSQL → HTTP-only cookie');
  });
}

start();
