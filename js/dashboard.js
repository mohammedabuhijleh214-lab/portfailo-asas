/**
 * Cyber Warden — Admin Dashboard & Project Store
 * Local persistence simulates PostgreSQL until backend ships.
 * @module dashboard
 */

'use strict';

import { CONFIG, SEED_PROJECTS, SEED_SERVICES } from './config.js';
import { i18n } from './i18n.js';
import {
  AuthApi,
  RateLimiter,
  escapeHtml,
  generateCsrfToken,
  sanitizeText,
  validateProjectPayload,
  validateServicePayload,
} from './security.js';
import { trapFocus } from './a11y.js';

const loginLimiter = new RateLimiter({ maxAttempts: 5, windowMs: 60_000 });

export class ProjectStore {
  constructor() {
    this.key = CONFIG.storage.projectsKey;
    this.listeners = new Set();
    this.projects = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        const seed = structuredClone(SEED_PROJECTS);
        this.persist(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('invalid');
      return parsed;
    } catch {
      const seed = structuredClone(SEED_PROJECTS);
      this.persist(seed);
      return seed;
    }
  }

  persist(list = this.projects) {
    localStorage.setItem(this.key, JSON.stringify(list));
    this.projects = list;
    this.listeners.forEach((fn) => fn(this.getPublicProjects()));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getPublicProjects() {
    return this.projects.filter((p) => p.status === 'published' && !p.hidden);
  }

  getAll() {
    return [...this.projects];
  }

  getById(id) {
    return this.projects.find((p) => p.id === id) || null;
  }

  upsert(payload, id = null) {
    const result = validateProjectPayload(payload);
    if (!result.ok) return result;

    const now = new Date().toISOString();
    if (id) {
      const idx = this.projects.findIndex((p) => p.id === id);
      if (idx === -1) return { ok: false, errors: ['Project not found.'] };
      this.projects[idx] = {
        ...this.projects[idx],
        ...result.value,
        id,
        updatedAt: now,
      };
    } else {
      this.projects.unshift({
        ...result.value,
        id: `proj_${generateCsrfToken().slice(0, 10)}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    this.persist();
    AuditLog.record(id ? 'project.update' : 'project.create', { id: id || this.projects[0].id });
    return { ok: true, value: id ? this.getById(id) : this.projects[0] };
  }

  remove(id) {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.persist();
    AuditLog.record('project.delete', { id });
    return { ok: true };
  }

  setHidden(id, hidden) {
    const p = this.getById(id);
    if (!p) return { ok: false };
    p.hidden = Boolean(hidden);
    p.updatedAt = new Date().toISOString();
    this.persist();
    AuditLog.record('project.hide', { id, hidden });
    return { ok: true };
  }

  setStatus(id, status) {
    const p = this.getById(id);
    if (!p) return { ok: false };
    p.status = status;
    p.updatedAt = new Date().toISOString();
    this.persist();
    AuditLog.record('project.status', { id, status });
    return { ok: true };
  }

  reorder(fromId, toId) {
    const from = this.projects.findIndex((p) => p.id === fromId);
    const to = this.projects.findIndex((p) => p.id === toId);
    if (from < 0 || to < 0 || from === to) return { ok: false };
    const [item] = this.projects.splice(from, 1);
    this.projects.splice(to, 0, item);
    this.persist();
    AuditLog.record('project.reorder', { fromId, toId });
    return { ok: true };
  }

  replaceAll(list) {
    this.persist(Array.isArray(list) ? list : []);
    return { ok: true };
  }

  exportJson() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: 2,
        projects: this.projects,
      },
      null,
      2
    );
  }

  importJson(text) {
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : data.projects;
      if (!Array.isArray(list)) return { ok: false, errors: ['Invalid JSON structure.'] };
      const cleaned = [];
      for (const item of list) {
        const v = validateProjectPayload(item);
        if (!v.ok) continue;
        cleaned.push({
          ...v.value,
          id: sanitizeText(item.id, { maxLength: 64 }) || `proj_${generateCsrfToken().slice(0, 10)}`,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      if (!cleaned.length) return { ok: false, errors: ['No valid projects in import.'] };
      this.persist(cleaned);
      AuditLog.record('project.import', { count: cleaned.length });
      return { ok: true, value: cleaned };
    } catch {
      return { ok: false, errors: ['Malformed JSON.'] };
    }
  }
}

/** Sellable services — independent from portfolio projects */
export class ServiceStore {
  constructor() {
    this.key = CONFIG.storage.servicesKey;
    this.listeners = new Set();
    this.services = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        const seed = structuredClone(SEED_SERVICES);
        this.persist(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('invalid');
      return parsed;
    } catch {
      const seed = structuredClone(SEED_SERVICES);
      this.persist(seed);
      return seed;
    }
  }

  persist(list = this.services) {
    localStorage.setItem(this.key, JSON.stringify(list));
    this.services = list;
    this.listeners.forEach((fn) => fn(this.getPublicServices()));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getPublicServices() {
    return this.services
      .filter((s) => s.status === 'published' && !s.hidden)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  getAll() {
    return [...this.services];
  }

  getById(id) {
    return this.services.find((s) => s.id === id) || null;
  }

  upsert(payload, id = null) {
    const result = validateServicePayload(payload);
    if (!result.ok) return result;
    const now = new Date().toISOString();
    if (id) {
      const idx = this.services.findIndex((s) => s.id === id);
      if (idx === -1) return { ok: false, errors: ['Service not found.'] };
      this.services[idx] = { ...this.services[idx], ...result.value, id, updatedAt: now };
    } else {
      this.services.unshift({
        ...result.value,
        id: `svc_${generateCsrfToken().slice(0, 10)}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    this.persist();
    AuditLog.record(id ? 'service.update' : 'service.create', {
      id: id || this.services[0].id,
    });
    return { ok: true, value: id ? this.getById(id) : this.services[0] };
  }

  remove(id) {
    this.services = this.services.filter((s) => s.id !== id);
    this.persist();
    AuditLog.record('service.delete', { id });
    return { ok: true };
  }

  setHidden(id, hidden) {
    const s = this.getById(id);
    if (!s) return { ok: false };
    s.hidden = Boolean(hidden);
    s.updatedAt = new Date().toISOString();
    this.persist();
    AuditLog.record('service.hide', { id, hidden });
    return { ok: true };
  }

  setStatus(id, status) {
    const s = this.getById(id);
    if (!s) return { ok: false };
    s.status = status;
    s.updatedAt = new Date().toISOString();
    this.persist();
    AuditLog.record('service.status', { id, status });
    return { ok: true };
  }

  reorder(fromId, toId) {
    const sorted = this.getAll().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const from = sorted.findIndex((s) => s.id === fromId);
    const to = sorted.findIndex((s) => s.id === toId);
    if (from < 0 || to < 0 || from === to) return { ok: false };
    const [item] = sorted.splice(from, 1);
    sorted.splice(to, 0, item);
    sorted.forEach((s, i) => {
      s.sortOrder = i + 1;
      s.updatedAt = new Date().toISOString();
    });
    this.persist(sorted);
    AuditLog.record('service.reorder', { fromId, toId });
    return { ok: true };
  }

  replaceAll(list) {
    this.persist(Array.isArray(list) ? list : []);
    return { ok: true };
  }

  exportJson() {
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), version: 1, services: this.services },
      null,
      2
    );
  }

  importJson(text) {
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : data.services;
      if (!Array.isArray(list)) return { ok: false, errors: ['Invalid services JSON.'] };
      const cleaned = [];
      for (const item of list) {
        const v = validateServicePayload(item);
        if (!v.ok) continue;
        cleaned.push({
          ...v.value,
          id: sanitizeText(item.id, { maxLength: 64 }) || `svc_${generateCsrfToken().slice(0, 10)}`,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      if (!cleaned.length) return { ok: false, errors: ['No valid services in import.'] };
      this.persist(cleaned);
      AuditLog.record('service.import', { count: cleaned.length });
      return { ok: true, value: cleaned };
    } catch {
      return { ok: false, errors: ['Malformed JSON.'] };
    }
  }
}

export const AuditLog = {
  key: CONFIG.storage.auditKey,

  record(action, meta = {}) {
    const entry = {
      id: generateCsrfToken().slice(0, 12),
      action,
      meta,
      at: new Date().toISOString(),
    };
    const list = this.all();
    list.unshift(entry);
    localStorage.setItem(this.key, JSON.stringify(list.slice(0, 200)));
    return entry;
  },

  all() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  },
};

/** Undo / redo snapshots for CMS content */
export class HistoryStack {
  constructor(limit = 40) {
    this.limit = limit;
    this.past = [];
    this.future = [];
  }

  push(snapshot) {
    this.past.push(structuredClone(snapshot));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current) {
    if (!this.past.length) return null;
    this.future.push(structuredClone(current));
    return this.past.pop();
  }

  redo(current) {
    if (!this.future.length) return null;
    this.past.push(structuredClone(current));
    return this.future.pop();
  }
}

export async function uploadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    return { ok: false, error: 'Invalid image' };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: 'Image too large (max 2MB)' };
  }

  try {
    const csrf = await AuthApi.fetchCsrf();
    const body = new FormData();
    body.append('image', file);
    const res = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.upload}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrf.token },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const url =
        data.url?.startsWith('http')
          ? data.url
          : `${CONFIG.api.baseUrl.replace(/\/api\/v1$/, '')}${data.url}`;
      return { ok: true, url };
    }
  } catch {
    /* fall through to local data URL */
  }

  // Authenticated API unavailable — local preview data URL (not uploaded)
  if (file.size > 600_000) {
    return { ok: false, error: 'API upload unavailable; use a smaller image or Image URL' };
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  }).catch(() => '');
  if (!dataUrl) return { ok: false, error: 'Could not read image' };
  return { ok: true, url: dataUrl, local: true };
}

export const AnalyticsStore = {
  key: CONFIG.storage.analyticsKey,

  bump(metric) {
    const data = this.read();
    data[metric] = (data[metric] || 0) + 1;
    data.lastVisit = new Date().toISOString();
    localStorage.setItem(this.key, JSON.stringify(data));
    return data;
  },

  read() {
    try {
      return (
        JSON.parse(localStorage.getItem(this.key) || 'null') || {
          pageViews: 0,
          projectOpens: 0,
          terminalCommands: 0,
          lastVisit: null,
        }
      );
    } catch {
      return { pageViews: 0, projectOpens: 0, terminalCommands: 0, lastVisit: null };
    }
  },

  // Chart uses real local counts only (pageViews / projectOpens) — no simulated series.
};

export class AdminSession {
  constructor() {
    this.key = CONFIG.auth.sessionKey;
    this.session = this.read();
  }

  read() {
    try {
      const raw = sessionStorage.getItem(this.key);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.issuedAt > CONFIG.auth.idleTimeoutMs) {
        this.clear();
        return null;
      }
      // UI cache only — real authority is HTTP-only cookie + /auth/session
      if (s.role !== 'admin') {
        this.clear();
        return null;
      }
      return s;
    } catch {
      return null;
    }
  }

  get isAuthenticated() {
    return Boolean(this.session?.role === 'admin');
  }

  async login(username, password, onStage) {
    if (!loginLimiter.canAttempt()) {
      return { ok: false, error: 'auth.rateLimited', stages: [] };
    }
    loginLimiter.recordAttempt();

    let csrfToken = '';
    try {
      onStage?.('Requesting CSRF challenge…');
      const csrf = await AuthApi.fetchCsrf();
      csrfToken = csrf.token;
    } catch {
      return { ok: false, error: 'auth.unavailable', stages: [] };
    }

    const result = await AuthApi.login({ username, password, csrfToken });

    for (const stage of result.stages || []) {
      onStage?.(stage);
      await sleep(CONFIG.auth.handshakeMs / Math.max(1, result.stages.length));
    }

    if (!result.ok) {
      AuditLog.record('auth.fail', { username: sanitizeText(username, { maxLength: 64 }) });
      return result;
    }

    // Cache non-sensitive UI state only (no password, no server secrets)
    this.session = {
      role: result.session.role,
      displayName: result.session.displayName,
      issuedAt: Date.now(),
    };
    sessionStorage.setItem(this.key, JSON.stringify(this.session));
    AuditLog.record('auth.success', { role: this.session.role });
    return result;
  }

  async logout() {
    await AuthApi.logout();
    AuditLog.record('auth.logout', {});
    this.clear();
  }

  async refreshFromServer() {
    const check = await AuthApi.session();
    if (!check.ok || !check.session?.authenticated) {
      this.clear();
      return false;
    }
    this.session = {
      role: check.session.role || 'admin',
      displayName: check.session.displayName || 'Admin',
      issuedAt: Date.now(),
    };
    sessionStorage.setItem(this.key, JSON.stringify(this.session));
    return true;
  }

  clear() {
    this.session = null;
    sessionStorage.removeItem(this.key);
  }
}

/**
 * Dashboard UI controller — portfolio projects + sellable services
 */
export class DashboardController {
  /**
   * @param {{
   *   store: ProjectStore,
   *   serviceStore: ServiceStore,
   *   session: AdminSession,
   *   onProjectsChange: Function,
   *   onServicesChange: Function,
   * }} deps
   */
  constructor(deps) {
    this.store = deps.store;
    this.serviceStore = deps.serviceStore;
    this.session = deps.session;
    this.onProjectsChange = deps.onProjectsChange;
    this.onServicesChange = deps.onServicesChange;
    this.root = document.getElementById('admin-dashboard');
    this.loginRoot = document.getElementById('admin-login');
    this.history = new HistoryStack();
    this._autosaveTimer = null;
    this._dragId = null;
    this._releaseLoginFocus = null;
    this.state = {
      query: '',
      status: 'all',
      sort: 'updatedAt',
      page: 1,
      editingId: null,
      svcEditingId: null,
    };
  }

  init() {
    this.bindLogin();
    this.bindDashboard();
    this.syncVisibility();
  }

  syncVisibility() {
    const authed = this.session.isAuthenticated;
    this.loginRoot?.classList.toggle('is-open', !authed && this.loginRoot.classList.contains('is-open'));
    this.root?.classList.toggle('is-open', authed);
    if (authed) this.render();
  }

  openLogin() {
    this.loginRoot?.classList.add('is-open');
    this.loginRoot?.setAttribute('aria-hidden', 'false');
    this._releaseLoginFocus?.();
    if (this.loginRoot) this._releaseLoginFocus = trapFocus(this.loginRoot);
    document.getElementById('admin-username')?.focus();
  }

  closeLogin() {
    this.loginRoot?.classList.remove('is-open');
    this.loginRoot?.setAttribute('aria-hidden', 'true');
    this._releaseLoginFocus?.();
    this._releaseLoginFocus = null;
  }

  bindLogin() {
    const form = document.getElementById('admin-login-form');
    const closeBtn = document.getElementById('admin-login-close');
    closeBtn?.addEventListener('click', () => this.closeLogin());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.loginRoot?.classList.contains('is-open')) {
        this.closeLogin();
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = /** @type {HTMLInputElement} */ (document.getElementById('admin-username'))
        .value;
      const password = /** @type {HTMLInputElement} */ (document.getElementById('admin-password'))
        .value;
      const stageEl = document.getElementById('handshake-stages');
      const errEl = document.getElementById('login-error');
      const submitBtn = form.querySelector('[type="submit"]');

      errEl.textContent = '';
      stageEl.replaceChildren();
      stageEl.hidden = false;
      submitBtn.disabled = true;
      form.classList.add('is-handshaking');

      const result = await this.session.login(username, password, (stage) => {
        const li = document.createElement('li');
        li.textContent = stage;
        li.className = 'handshake-stage is-active';
        stageEl.appendChild(li);
        stageEl.querySelectorAll('.handshake-stage').forEach((el, i, arr) => {
          if (i < arr.length - 1) el.classList.replace('is-active', 'is-done');
        });
      });

      form.classList.remove('is-handshaking');
      submitBtn.disabled = false;

      if (!result.ok) {
        const code = String(result.error || 'auth.failed').replace(/^auth\./, '');
        errEl.textContent = i18n.t.auth?.[code] || i18n.t.auth.failed;
        return;
      }

      this.closeLogin();
      this.root?.classList.add('is-open');
      this.root?.setAttribute('aria-hidden', 'false');
      this.notify(i18n.t.auth?.success || 'Session established.', 'success');
      this.render();
    });
  }

  bindDashboard() {
    document.getElementById('admin-logout')?.addEventListener('click', async () => {
      await this.session.logout();
      this.root?.classList.remove('is-open');
      this.root?.setAttribute('aria-hidden', 'true');
      this.notify(i18n.t.dash?.logoutDone || 'Session terminated.', 'info');
    });

    document.getElementById('dash-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('dash-redo')?.addEventListener('click', () => this.redo());
    document.getElementById('dash-preview')?.addEventListener('click', () => this.previewDraft());

    document.getElementById('dash-search')?.addEventListener('input', (e) => {
      this.state.query = sanitizeText(e.target.value, { maxLength: 80 });
      this.state.page = 1;
      this.renderProjectsTable();
    });

    document.getElementById('dash-filter-status')?.addEventListener('change', (e) => {
      this.state.status = e.target.value;
      this.state.page = 1;
      this.renderProjectsTable();
    });

    document.getElementById('dash-sort')?.addEventListener('change', (e) => {
      this.state.sort = e.target.value;
      this.renderProjectsTable();
    });

    document.getElementById('project-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProject();
    });

    document.getElementById('project-form-reset')?.addEventListener('click', () => {
      this.state.editingId = null;
      /** @type {HTMLFormElement} */ (document.getElementById('project-form')).reset();
      document.getElementById('form-title').textContent = i18n.t.dash.addProject;
    });

    document.getElementById('service-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveService();
    });

    document.getElementById('service-form-reset')?.addEventListener('click', () => {
      this.state.svcEditingId = null;
      /** @type {HTMLFormElement} */ (document.getElementById('service-form')).reset();
      const titleEl = document.getElementById('service-form-title');
      if (titleEl) titleEl.textContent = i18n.t.dash.addService;
    });

    this.bindAutosave('project-form');
    this.bindAutosave('service-form');
    this.bindImageUpload('p-image-file', 'p-image');
    this.bindImageUpload('s-image-file', 's-image');
    this.bindServiceDragDrop();

    document.getElementById('export-json')?.addEventListener('click', () => {
      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          version: 2,
          projects: this.store.getAll(),
          services: this.serviceStore.getAll(),
        },
        null,
        2
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber-warden-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.notify(i18n.t.dash.exported || 'Backup exported.', 'success');
      AuditLog.record('backup.export', {
        projects: this.store.getAll().length,
        services: this.serviceStore.getAll().length,
      });
    });

    document.getElementById('export-services')?.addEventListener('click', () => {
      const blob = new Blob([this.serviceStore.exportJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber-warden-services-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.notify(i18n.t.dash.exportedServices || 'Services exported.', 'success');
      AuditLog.record('backup.export.services', { count: this.serviceStore.getAll().length });
    });

    document.getElementById('import-json')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        this.notify(i18n.t.dash.badJson || 'Malformed JSON.', 'error');
        e.target.value = '';
        return;
      }

      this.snapshot();
      let importedProjects = 0;
      let importedServices = 0;
      const messages = [];

      const hasProjects = Array.isArray(data) || Array.isArray(data?.projects);
      const hasServices = Array.isArray(data?.services);

      if (hasProjects) {
        const result = this.store.importJson(
          Array.isArray(data) ? text : JSON.stringify({ projects: data.projects })
        );
        if (result.ok) {
          importedProjects = result.value.length;
          this.onProjectsChange?.();
        } else {
          messages.push(...(result.errors || ['Project import failed.']));
        }
      }

      if (hasServices) {
        const result = this.serviceStore.importJson(JSON.stringify({ services: data.services }));
        if (result.ok) {
          importedServices = result.value.length;
          this.onServicesChange?.();
        } else {
          messages.push(...(result.errors || ['Service import failed.']));
        }
      }

      if (!hasProjects && !hasServices) {
        this.notify(i18n.t.dash.badJson || 'Invalid JSON structure.', 'error');
        e.target.value = '';
        return;
      }

      this.render();

      if (importedProjects || importedServices) {
        const parts = [];
        if (importedProjects) parts.push(`${importedProjects}`);
        if (importedServices) parts.push(`${importedServices}`);
        this.notify(i18n.t.dash.imported || 'Import complete.', 'success');
      } else if (messages.length) {
        this.notify(messages.join(' '), 'error');
      }

      e.target.value = '';
    });

    document.getElementById('dash-prev')?.addEventListener('click', () => {
      this.state.page = Math.max(1, this.state.page - 1);
      this.renderProjectsTable();
    });
    document.getElementById('dash-next')?.addEventListener('click', () => {
      this.state.page += 1;
      this.renderProjectsTable();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.root?.classList.contains('is-open')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  snapshot() {
    this.history.push({
      projects: this.store.getAll(),
      services: this.serviceStore.getAll(),
    });
  }

  undo() {
    const snap = this.history.undo({
      projects: this.store.getAll(),
      services: this.serviceStore.getAll(),
    });
    if (!snap) {
      this.notify(i18n.t.dash.nothingUndo || 'Nothing to undo.', 'info');
      return;
    }
    this.store.replaceAll(snap.projects);
    this.serviceStore.replaceAll(snap.services);
    this.onProjectsChange?.();
    this.onServicesChange?.();
    this.render();
    this.notify(i18n.t.dash.undone || 'Undone.', 'info');
  }

  redo() {
    const snap = this.history.redo({
      projects: this.store.getAll(),
      services: this.serviceStore.getAll(),
    });
    if (!snap) {
      this.notify(i18n.t.dash.nothingRedo || 'Nothing to redo.', 'info');
      return;
    }
    this.store.replaceAll(snap.projects);
    this.serviceStore.replaceAll(snap.services);
    this.onProjectsChange?.();
    this.onServicesChange?.();
    this.render();
    this.notify(i18n.t.dash.redone || 'Redone.', 'info');
  }

  bindAutosave(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const mark = () => {
      clearTimeout(this._autosaveTimer);
      this._autosaveTimer = setTimeout(() => {
        const draft = {};
        new FormData(form).forEach((v, k) => {
          draft[k] = String(v);
        });
        sessionStorage.setItem(`cw_draft_${formId}`, JSON.stringify(draft));
        const el = document.getElementById('autosave-status');
        if (el) el.textContent = i18n.t.dash.autosaved || 'Draft autosaved';
      }, 900);
    };
    form.addEventListener('input', mark);
    form.addEventListener('change', mark);

    try {
      const raw = sessionStorage.getItem(`cw_draft_${formId}`);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore empty forms
      const title = form.elements.namedItem('title');
      if (title && !String(/** @type {HTMLInputElement} */ (title).value || '').trim()) {
        Object.entries(draft).forEach(([k, v]) => {
          const field = form.elements.namedItem(k);
          if (field && 'value' in field) /** @type {HTMLInputElement} */ (field).value = String(v);
        });
      }
    } catch {
      /* ignore */
    }
  }

  bindImageUpload(fileInputId, urlInputId) {
    const fileInput = document.getElementById(fileInputId);
    const urlInput = document.getElementById(urlInputId);
    if (!fileInput || !urlInput) return;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      this.notify(i18n.t.common.loading || 'Uploading…', 'info');
      const result = await uploadImageFile(file);
      fileInput.value = '';
      if (!result.ok) {
        this.notify(result.error || 'Upload failed', 'error');
        return;
      }
      /** @type {HTMLInputElement} */ (urlInput).value = result.url;
      this.notify(
        result.local
          ? i18n.t.dash.uploadLocal || 'Image attached locally.'
          : i18n.t.dash.uploadOk || 'Image uploaded.',
        'success'
      );
    });
  }

  bindServiceDragDrop() {
    const tbody = document.getElementById('services-tbody');
    if (!tbody || tbody.dataset.dndBound) return;
    tbody.dataset.dndBound = '1';
    tbody.addEventListener('dragstart', (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      this._dragId = tr.dataset.id;
      tr.classList.add('is-dragging');
      e.dataTransfer?.setData('text/plain', tr.dataset.id || '');
      e.dataTransfer.effectAllowed = 'move';
    });
    tbody.addEventListener('dragend', (e) => {
      e.target.closest('tr')?.classList.remove('is-dragging');
      this._dragId = null;
    });
    tbody.addEventListener('dragover', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr[data-id]');
      if (tr) tr.classList.add('is-drop-target');
    });
    tbody.addEventListener('dragleave', (e) => {
      e.target.closest('tr')?.classList.remove('is-drop-target');
    });
    tbody.addEventListener('drop', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr[data-id]');
      tr?.classList.remove('is-drop-target');
      const toId = tr?.dataset.id;
      const fromId = this._dragId || e.dataTransfer?.getData('text/plain');
      if (!fromId || !toId || fromId === toId) return;
      this.snapshot();
      this.serviceStore.reorder(fromId, toId);
      this.onServicesChange?.();
      this.renderServicesTable();
      this.notify(i18n.t.dash.reordered || 'Order updated.', 'success');
    });
  }

  previewDraft() {
    const form = /** @type {HTMLFormElement} */ (document.getElementById('project-form'));
    const svcForm = /** @type {HTMLFormElement} */ (document.getElementById('service-form'));
    const fd = form && new FormData(form);
    const title = fd ? sanitizeText(fd.get('title'), { maxLength: 120 }) : '';
    const short = fd ? sanitizeText(fd.get('shortDescription'), { maxLength: 280 }) : '';
    const image = fd ? String(fd.get('imageUrl') || '') : '';
    const host = document.getElementById('cms-preview');
    if (!host) {
      this.notify(`${title || 'Preview'}: ${short}`, 'info');
      return;
    }
    host.hidden = false;
    host.innerHTML = `
      <div class="cms-preview-card">
        <button type="button" class="modal-close" id="cms-preview-close" aria-label="Close">×</button>
        <p class="cms-preview-kicker">${escapeHtml(i18n.t.dash.preview || 'Preview')}</p>
        <h3>${escapeHtml(title || i18n.t.dash.addProject)}</h3>
        <p>${escapeHtml(short || '—')}</p>
        ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" />` : ''}
      </div>
    `;
    document.getElementById('cms-preview-close')?.addEventListener('click', () => {
      host.hidden = true;
      host.replaceChildren();
    });
  }

  saveProject() {
    const form = /** @type {HTMLFormElement} */ (document.getElementById('project-form'));
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.hidden = fd.get('hidden') === 'on';
    payload.featured = fd.get('featured') === 'on';

    this.snapshot();
    const result = this.store.upsert(payload, this.state.editingId);
    if (!result.ok) {
      this.notify(result.errors.join(' '), 'error');
      return;
    }
    this.notify(
      this.state.editingId ? i18n.t.dash.updatedProject || 'Updated.' : i18n.t.dash.createdProject || 'Created.',
      'success'
    );
    this.state.editingId = null;
    form.reset();
    sessionStorage.removeItem('cw_draft_project-form');
    document.getElementById('form-title').textContent = i18n.t.dash.addProject;
    this.onProjectsChange?.();
    this.render();
  }

  saveService() {
    const form = /** @type {HTMLFormElement} */ (document.getElementById('service-form'));
    if (!form) return;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.hidden = fd.get('hidden') === 'on';
    payload.featured = fd.get('featured') === 'on';

    this.snapshot();
    const result = this.serviceStore.upsert(payload, this.state.svcEditingId);
    if (!result.ok) {
      this.notify(result.errors.join(' '), 'error');
      return;
    }
    this.notify(
      this.state.svcEditingId ? i18n.t.dash.updatedService || 'Updated.' : i18n.t.dash.createdService || 'Created.',
      'success'
    );
    this.state.svcEditingId = null;
    form.reset();
    sessionStorage.removeItem('cw_draft_service-form');
    const titleEl = document.getElementById('service-form-title');
    if (titleEl) titleEl.textContent = i18n.t.dash.addService;
    this.onServicesChange?.();
    this.render();
  }

  render() {
    i18n.hydrate(this.root || document);
    this.renderStats();
    this.renderProjectsTable();
    this.renderServicesTable();
    this.renderAudit();
    this.renderChart();
  }

  renderStats() {
    const analytics = AnalyticsStore.read();
    const projects = this.store.getAll();
    const services = this.serviceStore.getAll();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };
    set('stat-views', analytics.pageViews);
    set('stat-projects', projects.length);
    set('stat-services', services.length);
    set('stat-published', services.filter((s) => s.status === 'published').length);
  }

  renderProjectsTable() {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    let list = this.store.getAll();
    if (this.state.status !== 'all') {
      list = list.filter((p) => p.status === this.state.status);
    }
    if (this.state.query) {
      const q = this.state.query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (this.state.sort === 'title') return a.title.localeCompare(b.title);
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });

    const size = CONFIG.pagination.pageSize;
    const pages = Math.max(1, Math.ceil(list.length / size));
    if (this.state.page > pages) this.state.page = pages;
    const slice = list.slice((this.state.page - 1) * size, this.state.page * size);

    tbody.replaceChildren();
    const d = i18n.t.dash;
    for (const p of slice) {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      tr.innerHTML = `
        <td><strong>${escapeHtml(p.title)}</strong></td>
        <td><span class="badge badge-${escapeHtml(p.status)}">${escapeHtml(p.status)}</span></td>
        <td>${p.hidden ? escapeHtml(d.hidden) : escapeHtml(d.visible)}</td>
        <td class="table-actions"></td>
      `;
      const actions = tr.querySelector('.table-actions');
      actions.append(
        btn(d.edit, () => this.editProject(p.id)),
        btn(p.hidden ? d.show : d.hide, () => {
          this.snapshot();
          this.store.setHidden(p.id, !p.hidden);
          this.onProjectsChange?.();
          this.render();
        }),
        btn(p.status === 'published' ? d.draft : d.publish || 'Publish', () => {
          this.snapshot();
          this.store.setStatus(p.id, p.status === 'published' ? 'draft' : 'published');
          this.onProjectsChange?.();
          this.render();
        }),
        btn(
          d.delete,
          () => {
            if (confirm(`${d.delete} “${p.title}”?`)) {
              this.snapshot();
              this.store.remove(p.id);
              this.onProjectsChange?.();
              this.render();
            }
          },
          'danger'
        )
      );
      tbody.appendChild(tr);
    }

    const pageLabel = document.getElementById('dash-page-label');
    if (pageLabel) pageLabel.textContent = `${d.page || 'Page'} ${this.state.page} / ${pages}`;
  }

  renderServicesTable() {
    const tbody = document.getElementById('services-tbody');
    if (!tbody) return;

    const list = this.serviceStore.getAll().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    tbody.replaceChildren();
    const d = i18n.t.dash;

    for (const s of list) {
      const tr = document.createElement('tr');
      tr.dataset.id = s.id;
      tr.draggable = true;
      tr.innerHTML = `
        <td class="drag-cell" title="${escapeHtml(d.drag || 'Drag to reorder')}">⠿ <strong>${escapeHtml(s.title)}</strong></td>
        <td>$${escapeHtml(String(s.price))}</td>
        <td><span class="badge badge-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></td>
        <td>${s.hidden ? escapeHtml(d.hidden) : escapeHtml(d.visible)}</td>
        <td class="table-actions"></td>
      `;
      const actions = tr.querySelector('.table-actions');
      actions.append(
        btn(d.edit, () => this.editService(s.id)),
        btn(s.hidden ? d.show : d.hide, () => {
          this.snapshot();
          this.serviceStore.setHidden(s.id, !s.hidden);
          this.onServicesChange?.();
          this.render();
        }),
        btn(s.status === 'published' ? d.draft : d.publish || 'Publish', () => {
          this.snapshot();
          this.serviceStore.setStatus(s.id, s.status === 'published' ? 'draft' : 'published');
          this.onServicesChange?.();
          this.render();
        }),
        btn(
          d.delete,
          () => {
            if (confirm(`${d.delete} “${s.title}”?`)) {
              this.snapshot();
              this.serviceStore.remove(s.id);
              this.onServicesChange?.();
              this.render();
            }
          },
          'danger'
        )
      );
      tbody.appendChild(tr);
    }
  }

  editProject(id) {
    const p = this.store.getById(id);
    if (!p) return;
    this.state.editingId = id;
    document.getElementById('form-title').textContent = i18n.t.dash.editProject || 'Edit Portfolio Item';
    const form = /** @type {HTMLFormElement} */ (document.getElementById('project-form'));
    const el = (name) => /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (
      form.elements.namedItem(name)
    );
    el('title').value = p.title;
    el('shortDescription').value = p.shortDescription;
    el('fullDescription').value = p.fullDescription;
    el('liveUrl').value = p.liveUrl || '';
    el('imageUrl').value = p.imageUrl || '';
    el('status').value = p.status;
    el('features').value = (p.features || []).join('\n');
    el('securityFeatures').value = (p.securityFeatures || []).join('\n');
    el('technologies').value = (p.technologies || []).join(', ');
    el('architecture').value = p.architecture || '';
    el('challenges').value = p.challenges || '';
    el('solutions').value = p.solutions || '';
    /** @type {HTMLInputElement} */ (el('hidden')).checked = Boolean(p.hidden);
    /** @type {HTMLInputElement} */ (el('featured')).checked = Boolean(p.featured);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  editService(id) {
    const s = this.serviceStore.getById(id);
    if (!s) return;
    this.state.svcEditingId = id;
    const titleEl = document.getElementById('service-form-title');
    if (titleEl) titleEl.textContent = i18n.t.dash.editService || 'Edit Service';
    const form = /** @type {HTMLFormElement} */ (document.getElementById('service-form'));
    if (!form) return;
    const el = (name) => /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (
      form.elements.namedItem(name)
    );
    el('title').value = s.title;
    el('shortDescription').value = s.shortDescription;
    el('fullDescription').value = s.fullDescription;
    el('price').value = String(s.price ?? '');
    el('imageUrl').value = s.imageUrl || '';
    el('status').value = s.status;
    el('accent').value = s.accent || 'cyan';
    el('sortOrder').value = String(s.sortOrder ?? 0);
    el('deliverables').value = (s.deliverables || []).join('\n');
    /** @type {HTMLInputElement} */ (el('hidden')).checked = Boolean(s.hidden);
    /** @type {HTMLInputElement} */ (el('featured')).checked = Boolean(s.featured);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderAudit() {
    const list = document.getElementById('audit-list');
    if (!list) return;
    list.replaceChildren();
    for (const entry of AuditLog.all().slice(0, 12)) {
      const li = document.createElement('li');
      li.innerHTML = `<time>${escapeHtml(new Date(entry.at).toLocaleString())}</time>
        <span>${escapeHtml(entry.action)}</span>`;
      list.appendChild(li);
    }
  }

  renderChart() {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analytics = AnalyticsStore.read();
    const metrics = [
      { label: i18n.t.dash.views || 'Views', value: analytics.pageViews || 0, color: '#61F8FF' },
      { label: i18n.t.dash.opens || 'Opens', value: analytics.projectOpens || 0, color: '#A855F7' },
      {
        label: i18n.t.dash.terminalCmds || 'Shell',
        value: analytics.terminalCommands || 0,
        color: '#34D399',
      },
      {
        label: i18n.t.dash.services || 'Services',
        value: this.serviceStore.getAll().filter((s) => s.status === 'published').length,
        color: '#FFE3A2',
      },
    ];

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 560;
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Ambient grid
    ctx.strokeStyle = 'rgba(97, 248, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h - 20; y += 28) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(w - 16, y);
      ctx.stroke();
    }

    const max = Math.max(...metrics.map((m) => m.value), 1);
    const barW = Math.min(56, (w - 64) / metrics.length / 1.6);
    const gap = (w - metrics.length * barW) / (metrics.length + 1);

    metrics.forEach((m, i) => {
      const x = gap + i * (barW + gap);
      const barH = (m.value / max) * (h - 56);
      const y = h - 32 - barH;
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, m.color);
      grad.addColorStop(1, 'rgba(2, 4, 7, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = 6;
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(232, 240, 255, 0.75)';
      ctx.font = '11px IBM Plex Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + barW / 2, h - 12);
      ctx.fillStyle = m.color;
      ctx.fillText(String(m.value), x + barW / 2, y - 8);
    });
  }

  notify(message, type = 'info') {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }
}

function btn(label, onClick, variant = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn-table${variant ? ` btn-table-${variant}` : ''}`;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
