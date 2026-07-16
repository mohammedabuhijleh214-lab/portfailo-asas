/**
 * PWA install prompt, update detection, offline banner
 * @module pwa
 */

'use strict';

import { escapeHtml } from './security.js';

let deferredPrompt = null;

export function initPwa({ onNotify, i18n } = {}) {
  registerSw(onNotify, i18n);
  initInstallBanner(i18n);
  initOfflineBanner(i18n);
}

function registerSw(onNotify, i18n) {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(onNotify, i18n, reg);
          }
        });
      });
    } catch {
      /* ignore */
    }
  });
}

function showUpdateToast(onNotify, i18n, reg) {
  const host = document.getElementById('toast-host');
  if (!host) {
    onNotify?.(i18n?.t?.pwa?.update || 'Update available', 'info');
    return;
  }
  const el = document.createElement('div');
  el.className = 'toast toast-info pwa-update-toast is-visible';
  el.innerHTML = `
    <span>${escapeHtml(i18n?.t?.pwa?.update || 'A new version is ready.')}</span>
    <button type="button" class="btn-table">${escapeHtml(i18n?.t?.pwa?.reload || 'Reload')}</button>
  `;
  el.querySelector('button')?.addEventListener('click', () => {
    reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  host.appendChild(el);
}

function initInstallBanner(i18n) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwa-install');
    if (!banner) return;
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
    const label = banner.querySelector('[data-pwa-label]');
    if (label) label.textContent = i18n?.t?.pwa?.install || 'Install Cyber Warden';
  });

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    const banner = document.getElementById('pwa-install');
    if (banner) {
      banner.hidden = true;
      banner.setAttribute('aria-hidden', 'true');
    }
  });

  document.getElementById('pwa-install-dismiss')?.addEventListener('click', () => {
    const banner = document.getElementById('pwa-install');
    if (banner) {
      banner.hidden = true;
      banner.setAttribute('aria-hidden', 'true');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const banner = document.getElementById('pwa-install');
    if (banner) banner.hidden = true;
  });
}

function initOfflineBanner(i18n) {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;

  const sync = () => {
    const offline = !navigator.onLine;
    banner.hidden = !offline;
    banner.setAttribute('aria-hidden', String(!offline));
    const label = banner.querySelector('[data-offline-label]');
    if (label) {
      label.textContent = i18n?.t?.pwa?.offline || 'You are offline. Some features may be unavailable.';
    }
  };

  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}
