/**
 * Public services renderer
 * @module viz
 */

'use strict';

import { escapeHtml, sanitizeUrl } from './security.js';
import { sound } from './sound.js';
import { i18n } from './i18n.js';
import { buildSrcSet, optimizeImageUrl } from './media.js';

/**
 * @param {import('./dashboard.js').ServiceStore} serviceStore
 */
export function renderServices(serviceStore) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  const list = serviceStore.getPublicServices();
  const t = i18n.t.services;
  grid.replaceChildren();

  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = t.empty;
    grid.appendChild(empty);
    return;
  }

  list.forEach((s) => {
    const card = document.createElement('article');
    card.className = `service-card accent-${escapeHtml(s.accent || 'cyan')}`;
    card.setAttribute('data-gsap-fade', '');
    card.setAttribute('data-holo-card', '');
    const imgRaw = sanitizeUrl(s.imageUrl) || '';
    const img = imgRaw ? optimizeImageUrl(imgRaw, { w: 900 }) : '';
    const srcset = imgRaw ? buildSrcSet(imgRaw, [480, 720, 960]) : '';
    const title = i18n.field(s, 'title', 'services');
    const desc = i18n.field(s, 'shortDescription', 'services');
    let deliverables = i18n.field(s, 'deliverables', 'services');
    if (!Array.isArray(deliverables) || !deliverables.length) {
      deliverables = s.deliverables || [];
    }

    card.innerHTML = `
      <div class="service-media">
        ${
          img
            ? `<img src="${escapeHtml(img)}" ${srcset ? `srcset="${escapeHtml(srcset)}" sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 25vw"` : ''} alt="${escapeHtml(title)}" width="900" height="560" loading="lazy" decoding="async" />`
            : '<div class="service-media-fallback" role="img" aria-label=""></div>'
        }
        <div class="service-scan" aria-hidden="true"></div>
      </div>
      <div class="service-body">
        <div class="service-price"><span class="visually-hidden">${escapeHtml(t.priceLabel || 'Price')}</span>$${escapeHtml(String(s.price))} <small>${escapeHtml(t.usd)}</small></div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
        <ul>${deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        <a class="btn btn-ghost magnetic" href="#contact">${escapeHtml(t.inquire)}</a>
      </div>
    `;
    card.querySelector('a')?.addEventListener('click', () => sound.play('ui'));
    grid.appendChild(card);
  });
}
