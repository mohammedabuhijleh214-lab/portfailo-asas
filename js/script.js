/**
 * Cyber Warden — App bootstrap (focused, authentic)
 * @module script
 */

'use strict';

import { CONFIG } from './config.js';
import { ParticleSystem } from './particles.js';
import { CyberTerminal } from './terminal.js';
import {
  AdminSession,
  AnalyticsStore,
  DashboardController,
  ProjectStore,
  ServiceStore,
} from './dashboard.js';
import { escapeHtml, initSecurityObservers, sanitizeUrl } from './security.js';
import { injectStructuredData } from './seo.js';
import { i18n } from './i18n.js';
import { NeuralField } from './three-bg.js';
import { initGsapStory } from './gsap-story.js';
import { sound } from './sound.js';
import { initContactForm } from './contact.js';
import { renderShowcase } from './showcase.js';
import { renderServices } from './viz.js';
import { initPwa } from './pwa.js';
import { announce, trapFocus } from './a11y.js';

const store = new ProjectStore();
const serviceStore = new ServiceStore();
const session = new AdminSession();
let dashboard;

document.addEventListener('DOMContentLoaded', async () => {
  initSecurityObservers();
  injectStructuredData();
  AnalyticsStore.bump('pageViews');
  i18n.applyDocument();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initLoader();
  initAtmosphere();
  initNavigation();
  initMagneticButtons();
  initSmoothAnchors();
  initSectionObserver();
  initSectionIndicators();
  initScrollProgress();
  initTypewriters();
  initStrengths();
  initGift();
  initContactChannels();
  initModal();
  initTerminal();
  initAdminHotkey();
  initLocaleToggle();
  initSoundToggle();

  const refreshServices = () => {
    renderServices(serviceStore);
  };
  const refreshProjects = () => {
    renderShowcase(store);
  };

  refreshServices();
  refreshProjects();
  i18n.hydrate();
  hydrateDynamicLabels();

  initContactForm({
    i18n,
    onNotify: (msg, type) => dashboard?.notify(msg, type),
  });

  document.addEventListener('cw:open-project', (e) => openProjectModal(e.detail.id));

  dashboard = new DashboardController({
    store,
    serviceStore,
    session,
    onProjectsChange: refreshProjects,
    onServicesChange: refreshServices,
  });
  dashboard.init();

  // Confirm HTTP-only session with the API (UI cache is not authoritative)
  session.refreshFromServer().then((ok) => {
    if (ok) {
      document.getElementById('admin-dashboard')?.classList.add('is-open');
      document.getElementById('admin-dashboard')?.setAttribute('aria-hidden', 'false');
      dashboard.render();
    }
  });

  store.subscribe(refreshProjects);
  serviceStore.subscribe(refreshServices);

  await initGsapStory();
  initPwa({
    i18n,
    onNotify: (msg, type) => dashboard?.notify(msg, type),
  });
});

function initLoader() {
  const loader = document.getElementById('page-loader');
  const bar = document.getElementById('loader-bar');
  const label = document.getElementById('loader-label');
  if (!loader) return;
  const stages = ['Loading…', 'Preparing…', 'Ready.'];
  let i = 0;
  const tick = setInterval(() => {
    i += 1;
    const pct = Math.min(100, i * 34);
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = stages[Math.min(i, stages.length - 1)];
    if (pct >= 100) {
      clearInterval(tick);
      loader.classList.add('is-done');
      document.body.classList.add('is-loaded');
      setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 600);
    }
  }, 220);
}

async function initAtmosphere() {
  const webgl = document.getElementById('webgl-canvas');
  if (webgl) await new NeuralField(webgl).init();
  const canvas = document.getElementById('particle-canvas');
  if (canvas) new ParticleSystem(canvas).init();
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener(
    'pointermove',
    (e) => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    },
    { passive: true }
  );
}

function initNavigation() {
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  window.addEventListener(
    'scroll',
    () => nav?.classList.toggle('is-scrolled', window.scrollY > 40),
    { passive: true }
  );
  toggle?.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(nav?.classList.toggle('is-open')));
  });
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => {
      nav?.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && id !== '#' ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initSectionObserver() {
  const sections = document.querySelectorAll('[data-section]');
  const indicators = document.querySelectorAll('[data-indicator]');
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        indicators.forEach((el) =>
          el.classList.toggle('is-active', el.getAttribute('data-indicator') === id)
        );
        navLinks.forEach((el) =>
          el.classList.toggle('is-active', el.getAttribute('href') === `#${id}`)
        );
        const mood = entry.target.getAttribute('data-mood');
        if (mood) document.body.dataset.mood = mood;
      });
    },
    { threshold: 0.28 }
  );
  sections.forEach((s) => io.observe(s));

  const revealIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealIo.observe(el));
}

function initSectionIndicators() {
  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.getAttribute('data-scroll-to'))?.scrollIntoView({
        behavior: 'smooth',
      });
    });
  });
}

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener(
    'scroll',
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    },
    { passive: true }
  );
}

function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.2}px, ${(e.clientY - rect.top - rect.height / 2) * 0.2}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

function initTypewriters() {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;
  const phrases = [
    'Clean code. Secure defaults.',
    'Sites for small businesses & personal brands.',
    'Clear communication. Reliable delivery.',
  ];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = phrases[0];
    return;
  }
  let pi = 0;
  let ci = 0;
  let deleting = false;
  const tick = () => {
    const phrase = phrases[pi];
    el.textContent = phrase.slice(0, ci);
    if (!deleting && ci < phrase.length) {
      ci += 1;
      setTimeout(tick, 40);
    } else if (!deleting) {
      deleting = true;
      setTimeout(tick, 1400);
    } else if (ci > 0) {
      ci -= 1;
      setTimeout(tick, 22);
    } else {
      deleting = false;
      pi = (pi + 1) % phrases.length;
      setTimeout(tick, 280);
    }
  };
  tick();
}

function initStrengths() {
  const grid = document.getElementById('strengths-grid');
  if (!grid) return;
  grid.replaceChildren();
  CONFIG.strengths.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'strength-card glass reveal';
    card.style.setProperty('--delay', `${i * 50}ms`);
    const label = i18n.t.strengths?.[s.id] || s.label;
    card.innerHTML = `<div class="strength-icon" aria-hidden="true"></div><h3>${escapeHtml(label)}</h3>`;
    grid.appendChild(card);
  });
}

function initGift() {
  const title = document.getElementById('gift-title');
  const headline = document.getElementById('gift-headline');
  const desc = document.getElementById('gift-desc');
  if (title) title.textContent = i18n.t.gift.title;
  if (headline) headline.textContent = i18n.t.gift.headline;
  if (desc) desc.textContent = i18n.t.gift.description;
}

function hydrateDynamicLabels() {
  initGift();
  initStrengths();
  const termInput = document.getElementById('term-input');
  if (termInput) termInput.placeholder = i18n.t.terminal.placeholder;
}

function initContactChannels() {
  const { contact } = CONFIG;
  const map = {
    'contact-email': { href: `mailto:${contact.email}`, text: contact.email },
    'contact-phone': { href: `tel:${contact.phone}`, text: contact.phoneDisplay },
    'contact-github': { href: contact.github, text: 'GitHub' },
    'contact-linkedin': { href: contact.linkedin, text: 'LinkedIn' },
    'contact-discord': { href: contact.discord, text: 'Discord' },
  };
  Object.entries(map).forEach(([id, meta]) => {
    const a = document.getElementById(id);
    if (!a) return;
    const safe = sanitizeUrl(meta.href);
    if (safe) a.href = safe;
    a.textContent = meta.text;
  });
}

let releaseModalFocus = null;

function initModal() {
  const modal = document.getElementById('project-modal');
  const close = () => {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    releaseModalFocus?.();
    releaseModalFocus = null;
  };
  document.getElementById('modal-close')?.addEventListener('click', close);
  modal?.querySelector('.modal-backdrop')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) close();
  });
}

function openProjectModal(id) {
  const p = store.getById(id);
  const modal = document.getElementById('project-modal');
  const content = document.getElementById('modal-content');
  if (!p || !modal || !content) return;
  AnalyticsStore.bump('projectOpens');
  sound.play('ui');
  const t = i18n.t.projects;
  const list = (items) =>
    (items || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('') || '<li>—</li>';
  const live = sanitizeUrl(p.liveUrl);
  const gh = sanitizeUrl(p.githubUrl);
  let features = i18n.field(p, 'features', 'projects');
  if (!Array.isArray(features) || !features.length) features = p.features || [];
  let security = i18n.field(p, 'securityFeatures', 'projects');
  if (!Array.isArray(security) || !security.length) security = p.securityFeatures || [];
  const title = i18n.field(p, 'title', 'projects');
  const full = i18n.field(p, 'fullDescription', 'projects') || p.fullDescription;

  content.innerHTML = `
    <p class="modal-kicker">${escapeHtml(t.modalKicker)}</p>
    <h2 id="modal-title">${escapeHtml(title)}</h2>
    <p class="modal-lead">${escapeHtml(full)}</p>
    <div class="modal-grid">
      <section><h3>${escapeHtml(t.features)}</h3><ul>${list(features)}</ul></section>
      <section><h3>${escapeHtml(t.security)}</h3><ul>${list(security)}</ul></section>
      <section><h3>${escapeHtml(t.technologies)}</h3><ul>${list(p.technologies)}</ul></section>
      <section><h3>${escapeHtml(t.notes)}</h3><p>${escapeHtml(p.architecture || '—')}</p></section>
    </div>
    <div class="modal-footer">
      ${live ? `<a class="btn btn-primary" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.openLive)}</a>` : ''}
      ${gh ? `<a class="btn btn-ghost" href="${escapeHtml(gh)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.github)}</a>` : ''}
    </div>
  `;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modal.setAttribute('aria-labelledby', 'modal-title');
  document.body.classList.add('modal-open');
  releaseModalFocus?.();
  releaseModalFocus = trapFocus(modal);
  announce(title);
}

function initTerminal() {
  const root = document.getElementById('cyber-terminal');
  if (root) new CyberTerminal(root).init();
}

function initAdminHotkey() {
  const seq = ['c', 'w', 'a', 'd', 'm', 'i', 'n'];
  let buffer = [];
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    buffer.push(e.key.toLowerCase());
    buffer = buffer.slice(-seq.length);
    if (seq.every((k, i) => buffer[i] === k)) {
      buffer = [];
      if (session.isAuthenticated) {
        document.getElementById('admin-dashboard')?.classList.add('is-open');
        dashboard?.render();
      } else dashboard?.openLogin();
    }
  });
  document.getElementById('admin-trigger')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (session.isAuthenticated) {
      document.getElementById('admin-dashboard')?.classList.add('is-open');
      dashboard?.render();
    } else dashboard?.openLogin();
  });
}

function initLocaleToggle() {
  const btn = document.getElementById('locale-toggle');
  btn?.addEventListener('click', () => {
    i18n.toggle();
    refreshAllLocale();
    sound.play('ui');
    if (btn) btn.textContent = i18n.t.a11y.lang;
  });
  if (btn) btn.textContent = i18n.t.a11y.lang;
}

function refreshAllLocale() {
  i18n.hydrate();
  hydrateDynamicLabels();
  renderServices(serviceStore);
  renderShowcase(store);
}

function initSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  const sync = () => {
    btn?.setAttribute('aria-pressed', String(sound.enabled));
    btn?.classList.toggle('is-on', sound.enabled);
    if (btn) {
      btn.textContent = sound.enabled ? '♪' : '♪̸';
      btn.setAttribute('aria-label', sound.enabled ? i18n.t.a11y.soundOff : i18n.t.a11y.soundOn);
    }
  };
  btn?.addEventListener('click', () => {
    sound.toggle();
    sync();
  });
  sync();
}
