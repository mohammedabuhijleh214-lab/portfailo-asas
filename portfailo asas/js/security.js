/**
 * Cyber Warden — Security utilities + production Auth API client
 * Credentials are NEVER validated or stored in the frontend.
 * @module security
 */

'use strict';

import { CONFIG } from './config.js';

const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
});

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

export function escapeHtml(input) {
  const str = String(input ?? '');
  return str.replace(/[&<>"'`=/]/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

export function sanitizeText(input, opts = {}) {
  const max = opts.maxLength ?? 2000;
  let value = String(input ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (value.length > max) value = value.slice(0, max);
  return value;
}

export function sanitizeUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  if (DANGEROUS_PROTOCOLS.test(raw)) return null;
  if (!SAFE_URL.test(raw) && !raw.startsWith('www.')) return null;
  try {
    if (raw.startsWith('www.')) {
      const u = new URL(`https://${raw}`);
      if (!['http:', 'https:'].includes(u.protocol)) return null;
      return u.href;
    }
    if (raw.startsWith('/') || raw.startsWith('#')) return raw;
    const u = new URL(raw);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol)) return null;
    return u.href;
  } catch {
    return null;
  }
}

export function createSafeElement(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.className) el.className = opts.className;
  if (opts.text != null) el.textContent = String(opts.text);
  if (opts.attrs) {
    for (const [key, val] of Object.entries(opts.attrs)) {
      if (/^on/i.test(key) || key.includes(':')) continue;
      el.setAttribute(key, escapeHtml(val));
    }
  }
  return el;
}

export function generateCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a, b) {
  const sa = String(a);
  const sb = String(b);
  const len = Math.max(sa.length, sb.length);
  let diff = sa.length ^ sb.length;
  for (let i = 0; i < len; i += 1) {
    diff |= (sa.charCodeAt(i) || 0) ^ (sb.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export class RateLimiter {
  constructor({ maxAttempts, windowMs }) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = [];
  }

  canAttempt() {
    const now = Date.now();
    this.attempts = this.attempts.filter((t) => now - t < this.windowMs);
    return this.attempts.length < this.maxAttempts;
  }

  recordAttempt() {
    this.attempts.push(Date.now());
  }

  remainingLockMs() {
    if (this.canAttempt()) return 0;
    const oldest = this.attempts[0];
    return Math.max(0, this.windowMs - (Date.now() - oldest));
  }
}

function toList(v) {
  if (Array.isArray(v)) return v.map((x) => sanitizeText(x, { maxLength: 200 })).filter(Boolean);
  return String(v || '')
    .split(/\n|,/)
    .map((x) => sanitizeText(x, { maxLength: 200 }))
    .filter(Boolean);
}

export function validateProjectPayload(data) {
  const errors = [];
  const title = sanitizeText(data.title, { maxLength: 120 });
  const titleAr = sanitizeText(data.titleAr, { maxLength: 120 });
  const shortDescription = sanitizeText(data.shortDescription ?? data.description, {
    maxLength: 280,
  });
  const shortDescriptionAr = sanitizeText(data.shortDescriptionAr, { maxLength: 280 });
  const fullDescription = sanitizeText(data.fullDescription ?? data.description, {
    maxLength: 4000,
  });
  const fullDescriptionAr = sanitizeText(data.fullDescriptionAr, { maxLength: 4000 });
  const status = ['published', 'draft', 'archived'].includes(String(data.status))
    ? String(data.status)
    : 'draft';
  const liveUrl = data.liveUrl ? sanitizeUrl(data.liveUrl) : null;
  const imageUrl = data.imageUrl ? sanitizeUrl(data.imageUrl) : null;
  const githubUrl = data.githubUrl ? sanitizeUrl(data.githubUrl) : null;

  if (!title || title.length < 2) errors.push('Title is required (min 2 characters).');
  if (!shortDescription) errors.push('Description is required.');
  if (data.liveUrl && !liveUrl) errors.push('Live URL is invalid or uses a blocked protocol.');
  if (data.imageUrl && !imageUrl) errors.push('Image URL is invalid or uses a blocked protocol.');
  if (data.githubUrl && !githubUrl) errors.push('GitHub URL is invalid.');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      titleAr,
      shortDescription,
      shortDescriptionAr,
      fullDescription: fullDescription || shortDescription,
      fullDescriptionAr,
      features: toList(data.features),
      featuresAr: toList(data.featuresAr),
      securityFeatures: toList(data.securityFeatures),
      securityFeaturesAr: toList(data.securityFeaturesAr),
      technologies: toList(data.technologies),
      architecture: sanitizeText(data.architecture, { maxLength: 2000 }),
      architectureAr: sanitizeText(data.architectureAr, { maxLength: 2000 }),
      challenges: sanitizeText(data.challenges, { maxLength: 2000 }),
      solutions: sanitizeText(data.solutions, { maxLength: 2000 }),
      liveUrl: liveUrl || '',
      imageUrl: imageUrl || '',
      githubUrl: githubUrl || '',
      price: '',
      status,
      hidden: Boolean(data.hidden),
      featured: Boolean(data.featured),
      accent: sanitizeText(data.accent || 'cyan', { maxLength: 20 }) || 'cyan',
      gallery: Array.isArray(data.gallery)
        ? data.gallery.map(sanitizeUrl).filter(Boolean)
        : [],
      mockups: data.mockups && typeof data.mockups === 'object' ? data.mockups : {},
    },
  };
}

export function validateServicePayload(data) {
  const errors = [];
  const title = sanitizeText(data.title, { maxLength: 120 });
  const titleAr = sanitizeText(data.titleAr, { maxLength: 120 });
  const shortDescription = sanitizeText(data.shortDescription ?? data.description, {
    maxLength: 280,
  });
  const shortDescriptionAr = sanitizeText(data.shortDescriptionAr, { maxLength: 280 });
  const fullDescription = sanitizeText(data.fullDescription ?? data.description, {
    maxLength: 4000,
  });
  const fullDescriptionAr = sanitizeText(data.fullDescriptionAr, { maxLength: 4000 });
  const status = ['published', 'draft', 'archived'].includes(String(data.status))
    ? String(data.status)
    : 'draft';
  const imageUrl = data.imageUrl ? sanitizeUrl(data.imageUrl) : null;
  const priceNum = Number(data.price);
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? Math.round(priceNum) : NaN;
  const accent = sanitizeText(data.accent || 'cyan', { maxLength: 20 }) || 'cyan';
  const sortOrder = Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;

  if (!title || title.length < 2) errors.push('Service title is required.');
  if (!shortDescription) errors.push('Service description is required.');
  if (!Number.isFinite(price)) errors.push('Price must be a valid number (e.g. 180).');
  if (data.imageUrl && !imageUrl) errors.push('Image URL is invalid.');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      titleAr,
      shortDescription,
      shortDescriptionAr,
      fullDescription: fullDescription || shortDescription,
      fullDescriptionAr,
      deliverables: toList(data.deliverables),
      deliverablesAr: toList(data.deliverablesAr),
      price,
      currency: sanitizeText(data.currency || 'USD', { maxLength: 8 }) || 'USD',
      accent,
      imageUrl: imageUrl || '',
      status,
      hidden: Boolean(data.hidden),
      featured: Boolean(data.featured),
      sortOrder,
    },
  };
}

export function initSecurityObservers() {
  document.addEventListener(
    'securitypolicyviolation',
    () => {
      /* CSP violations are handled silently in production UI */
    },
    { passive: true }
  );
}

function apiUrl(path) {
  return `${CONFIG.api.baseUrl}${path}`;
}

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.api.timeoutMs);
  try {
    const res = await fetch(apiUrl(path), {
      credentials: 'include',
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Production auth client — talks only to the Express API.
 * Never validates passwords in the browser.
 */
export const AuthApi = {
  async fetchCsrf() {
    const res = await apiFetch(CONFIG.api.endpoints.csrf, { method: 'GET' });
    if (!res.ok) {
      throw new Error('CSRF_UNAVAILABLE');
    }
    const data = await res.json();
    if (!data?.token || String(data.token).length < 32) {
      throw new Error('CSRF_INVALID');
    }
    return { token: String(data.token) };
  },

  /**
   * @param {{ username: string, password: string, csrfToken: string }} credentials
   */
  async login(credentials) {
    const stages = [
      'Requesting CSRF challenge…',
      'Opening secure channel…',
      'Submitting credentials to auth service…',
      'Verifying server session…',
    ];

    const username = sanitizeText(credentials.username, { maxLength: 64 });
    const password = String(credentials.password ?? '');
    let csrf = String(credentials.csrfToken ?? '');

    if (!username || password.length < 8) {
      return { ok: false, error: 'auth.invalidFormat', stages };
    }

    try {
      if (!csrf || csrf.length < 32) {
        const fresh = await this.fetchCsrf();
        csrf = fresh.token;
      }

      const res = await apiFetch(CONFIG.api.endpoints.auth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        body: JSON.stringify({ username, password }),
      });

      let payload = {};
      try {
        payload = await res.json();
      } catch {
        payload = {};
      }

      if (res.status === 429) {
        return { ok: false, error: 'auth.rateLimited', stages };
      }
      if (res.status === 403) {
        return { ok: false, error: 'auth.csrfFailed', stages };
      }
      if (!res.ok) {
        return { ok: false, error: 'auth.failed', stages };
      }

      // Opaque session confirmation only — no secrets returned
      const sessionCheck = await this.session();
      if (!sessionCheck.ok || !sessionCheck.session?.authenticated) {
        return { ok: false, error: 'auth.sessionFailed', stages };
      }

      return {
        ok: true,
        session: {
          role: sessionCheck.session.role || 'admin',
          displayName: sessionCheck.session.displayName || 'Admin',
          issuedAt: Date.now(),
        },
        stages,
      };
    } catch {
      return { ok: false, error: 'auth.unavailable', stages };
    }
  },

  async logout() {
    try {
      await apiFetch(CONFIG.api.endpoints.logout, { method: 'POST' });
    } catch {
      /* ignore network errors on logout */
    }
    return { ok: true };
  },

  async session() {
    try {
      const res = await apiFetch(CONFIG.api.endpoints.session, { method: 'GET' });
      if (!res.ok) return { ok: false };
      const data = await res.json();
      return {
        ok: Boolean(data?.authenticated),
        session: data,
      };
    } catch {
      return { ok: false };
    }
  },
};
