/**
 * Portfolio showcase
 * @module showcase
 */

'use strict';

import { escapeHtml, sanitizeUrl } from './security.js';
import { AnalyticsStore } from './dashboard.js';
import { sound } from './sound.js';
import { i18n } from './i18n.js';
import { buildSrcSet, optimizeImageUrl } from './media.js';
import { announce, trapFocus } from './a11y.js';

let releaseLightboxFocus = null;

/**
 * @param {import('./dashboard.js').ProjectStore} store
 */
export function renderShowcase(store) {
  const rail = document.getElementById('showcase-rail');
  if (!rail) return;
  const projects = store.getPublicProjects();
  const t = i18n.t.projects;
  rail.replaceChildren();

  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = t.empty;
    rail.appendChild(empty);
    return;
  }

  projects.forEach((p, index) => {
    const article = document.createElement('article');
    article.className = `case-study accent-${escapeHtml(p.accent || 'cyan')}`;
    article.setAttribute('data-gsap-fade', '');

    const live = sanitizeUrl(p.liveUrl);
    const gh = sanitizeUrl(p.githubUrl);
    const heroRaw = sanitizeUrl(p.imageUrl) || '';
    const hero = heroRaw ? optimizeImageUrl(heroRaw, { w: 1400 }) : '';
    const heroSrcSet = heroRaw ? buildSrcSet(heroRaw, [640, 960, 1280, 1600]) : '';
    const gallery = (p.gallery || []).map(sanitizeUrl).filter(Boolean);
    const mock = p.mockups || {};
    const title = i18n.field(p, 'title', 'projects');
    const short = i18n.field(p, 'shortDescription', 'projects');
    let security = i18n.field(p, 'securityFeatures', 'projects');
    if (!Array.isArray(security) || !security.length) security = p.securityFeatures || [];
    const alt = `${title} — ${t.demoLabel}`;

    const mockSrc = (key, w) => {
      const u = sanitizeUrl(mock[key]) || heroRaw;
      return u ? optimizeImageUrl(u, { w }) : '';
    };

    article.innerHTML = `
      <div class="case-hero">
        ${
          hero
            ? `<img src="${escapeHtml(hero)}" ${heroSrcSet ? `srcset="${escapeHtml(heroSrcSet)}" sizes="(max-width: 768px) 100vw, 90vw"` : ''} alt="${escapeHtml(alt)}" width="1400" height="875" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" />`
            : ''
        }
        <div class="case-hero-overlay">
          <p class="case-index">${escapeHtml(t.demoLabel)} 0${index + 1}</p>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(short)}</p>
          <p class="case-note">${escapeHtml(t.demoNote)}</p>
          <div class="case-cta-row">
            <button type="button" class="btn btn-primary magnetic" data-open-dossier="${escapeHtml(p.id)}">${escapeHtml(t.open)}</button>
            ${live ? `<a class="btn btn-ghost" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.live)}</a>` : ''}
            ${gh ? `<a class="btn btn-ghost" href="${escapeHtml(gh)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.github)}</a>` : ''}
          </div>
        </div>
      </div>

      <div class="case-body glass">
        <div class="device-stage" role="group" aria-label="${escapeHtml(t.mockups || 'Device previews')}">
          <figure class="device device-desktop">
            <img src="${escapeHtml(mockSrc('desktop', 1200))}" alt="${escapeHtml(title)} — desktop" width="1200" height="750" loading="lazy" decoding="async" />
          </figure>
          <figure class="device device-tablet">
            <img src="${escapeHtml(mockSrc('tablet', 800))}" alt="${escapeHtml(title)} — tablet" width="800" height="1000" loading="lazy" decoding="async" />
          </figure>
          <figure class="device device-mobile">
            <img src="${escapeHtml(mockSrc('mobile', 480))}" alt="${escapeHtml(title)} — mobile" width="480" height="850" loading="lazy" decoding="async" />
          </figure>
        </div>

        ${
          gallery.length
            ? `<div class="case-gallery" role="list">
          ${gallery
            .map((src, i) => {
              const opt = optimizeImageUrl(src, { w: 640 });
              return `
            <button type="button" class="gallery-thumb" data-gallery-src="${escapeHtml(src)}" aria-label="${escapeHtml(title)} — ${i + 1}" role="listitem">
              <img src="${escapeHtml(opt)}" alt="" width="640" height="400" loading="lazy" decoding="async" />
            </button>`;
            })
            .join('')}
        </div>`
            : ''
        }

        <div class="case-panels">
          <section>
            <h4>${escapeHtml(t.builtWith)}</h4>
            <div class="tech-pills">${(p.technologies || [])
              .map((x) => `<span>${escapeHtml(x)}</span>`)
              .join('')}</div>
          </section>
          <section>
            <h4>${escapeHtml(t.securityNotes)}</h4>
            <ul>${security.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </section>
        </div>
      </div>
    `;

    rail.appendChild(article);
  });

  bindShowcaseInteractions();
}

function bindShowcaseInteractions() {
  document.querySelectorAll('[data-open-dossier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sound.play('ui');
      document.dispatchEvent(
        new CustomEvent('cw:open-project', { detail: { id: btn.getAttribute('data-open-dossier') } })
      );
    });
  });

  document.querySelectorAll('.gallery-thumb').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(btn.getAttribute('data-gallery-src')));
  });
}

function openLightbox(src) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', i18n.t.projects?.lightbox || 'Image preview');
    lb.innerHTML = `<button type="button" class="lightbox-close" aria-label="${escapeHtml(i18n.t.common.close)}">×</button><img alt="" />`;
    document.body.appendChild(lb);
    const close = () => {
      lb.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      releaseLightboxFocus?.();
      releaseLightboxFocus = null;
    };
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
    });
  }
  const safe = sanitizeUrl(src);
  if (!safe) return;
  const img = lb.querySelector('img');
  img.src = optimizeImageUrl(safe, { w: 1600 });
  img.alt = i18n.t.projects?.lightbox || 'Image preview';
  lb.querySelector('.lightbox-close')?.setAttribute('aria-label', i18n.t.common.close);
  lb.classList.add('is-open');
  document.body.classList.add('modal-open');
  releaseLightboxFocus?.();
  releaseLightboxFocus = trapFocus(lb);
  announce(i18n.t.projects?.lightbox || 'Image preview');
  AnalyticsStore.bump('projectOpens');
}
