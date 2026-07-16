/**
 * Cyber Warden — Production contact form
 * Frontend → Express /api/v1/contact → validation → PostgreSQL (+ optional email)
 * @module contact
 */

'use strict';

import { CONFIG } from './config.js';
import { AuthApi, escapeHtml, sanitizeText, sanitizeUrl } from './security.js';
import { sound } from './sound.js';

/**
 * @param {FormData} fd
 */
export function validateContact(fd) {
  const errors = [];
  const name = sanitizeText(fd.get('name'), { maxLength: 80 });
  const email = sanitizeText(fd.get('email'), { maxLength: 120 }).toLowerCase();
  const company = sanitizeText(fd.get('company'), { maxLength: 120 });
  const budget = sanitizeText(fd.get('budget'), { maxLength: 40 });
  const message = sanitizeText(fd.get('message'), { maxLength: 4000 });
  const honeypot = String(fd.get('website') || '').trim();

  if (honeypot) errors.push('Rejected.');
  if (name.length < 2) errors.push('Name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email required.');
  if (message.length < 12) errors.push('Please provide a fuller project brief.');

  return {
    ok: errors.length === 0,
    errors,
    value: { name, email, company, budget, message, website: '' },
  };
}

/**
 * POST /api/v1/contact with CSRF + credentials
 */
export async function submitContact(payload, csrfToken) {
  const url = `${CONFIG.api.baseUrl}${CONFIG.api.endpoints.contact}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.api.timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.status === 429) {
      return { ok: false, error: 'rate_limited' };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || 'Request failed' };
    }
    return { ok: true, ...(await res.json()) };
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

export function initContactForm({ i18n, onNotify }) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('contact-status');
    const btn = form.querySelector('[type="submit"]');
    const result = validateContact(new FormData(form));

    if (!result.ok) {
      if (status) {
        status.textContent = result.errors[0];
        status.dataset.state = 'error';
      }
      sound.play('ui');
      return;
    }

    btn.disabled = true;
    form.classList.add('is-loading');
    if (status) {
      status.textContent = i18n.t.common?.loading || '…';
      status.dataset.state = 'pending';
    }

    let csrf = '';
    try {
      csrf = (await AuthApi.fetchCsrf()).token;
    } catch {
      btn.disabled = false;
      form.classList.remove('is-loading');
      if (status) {
        status.textContent = i18n.t.contact.error;
        status.dataset.state = 'error';
      }
      onNotify?.(i18n.t.contact.error, 'error');
      return;
    }

    const res = await submitContact(result.value, csrf);
    btn.disabled = false;
    form.classList.remove('is-loading');

    if (!res.ok) {
      const msg =
        res.error === 'rate_limited'
          ? i18n.t.contact.rateLimited || i18n.t.contact.error
          : i18n.t.contact.error;
      if (status) {
        status.textContent = msg;
        status.dataset.state = 'error';
      }
      onNotify?.(msg, 'error');
      sound.play('ui');
      return;
    }

    form.reset();
    sound.play('success');
    if (status) {
      status.textContent = i18n.t.contact.success;
      status.dataset.state = 'success';
    }
    onNotify?.(i18n.t.contact.success, 'success');
  });
}

/** Safe mailto helper for fallback links */
export function safeMailto(email, subject) {
  const e = sanitizeUrl(`mailto:${email}`);
  if (!e) return '#';
  return `${e}?subject=${encodeURIComponent(subject || 'Cyber Warden Inquiry')}`;
}

export function renderContactChannels(root, contact) {
  if (!root) return;
  root.replaceChildren();
  const items = [
    { label: 'Email', href: safeMailto(contact.email), text: contact.email },
    { label: 'Phone', href: `tel:${contact.phone}`, text: contact.phoneDisplay },
  ];
  for (const item of items) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = item.label;
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.text;
    li.append(span, a);
    root.appendChild(li);
  }
}
