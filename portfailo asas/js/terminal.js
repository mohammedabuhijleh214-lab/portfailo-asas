/**
 * Cyber Warden — Interactive Secure Terminal (EN/AR)
 * @module terminal
 */

'use strict';

import { CONFIG } from './config.js';
import { i18n } from './i18n.js';
import { sanitizeText } from './security.js';

function lines() {
  const t = i18n.t.term;
  return {
    help: {
      desc: t.helpDesc,
      run: () => t.helpBody,
    },
    about: {
      desc: t.aboutDesc,
      run: () =>
        [
          `${CONFIG.brand.name} — ${CONFIG.brand.fullName}`,
          i18n.locale === 'ar' ? 'مطوّر ويب مستقل · بمراعاة الأمن' : CONFIG.brand.title,
          '',
          i18n.locale === 'ar'
            ? 'كود نظيف. تسليم آمن. تواصل واضح.'
            : CONFIG.brand.tagline,
          '',
          t.aboutExtra,
        ].join('\n'),
    },
    whoami: {
      desc: t.whoamiDesc,
      run: () =>
        [
          `name: ${CONFIG.brand.fullName}`,
          `brand: ${CONFIG.brand.name}`,
          t.whoamiRole,
        ].join('\n'),
    },
    skills: {
      desc: t.skillsDesc,
      run: () =>
        CONFIG.strengths
          .map((s, i) => {
            const label = i18n.t.strengths?.[s.id] || s.label;
            return `  [${String(i + 1).padStart(2, '0')}] ${label}`;
          })
          .join('\n'),
    },
    projects: {
      desc: t.projectsDesc,
      run: () => t.projectsBody,
    },
    contact: {
      desc: t.contactDesc,
      run: () =>
        [
          `email   ${CONFIG.contact.email}`,
          `phone   ${CONFIG.contact.phoneDisplay}`,
          `github  ${CONFIG.contact.github}`,
        ].join('\n'),
    },
    social: {
      desc: t.socialDesc,
      run: () =>
        [
          `LinkedIn  ${CONFIG.contact.linkedin}`,
          `Discord   ${CONFIG.contact.discord}`,
          `GitHub    ${CONFIG.contact.github}`,
        ].join('\n'),
    },
    scan: {
      desc: t.scanDesc,
      run: async (term) => {
        for (const line of t.scanLines) {
          await term.print(line);
          await sleep(220);
        }
      },
    },
    status: {
      desc: t.statusDesc,
      run: () => t.statusBody,
    },
    security: {
      desc: t.securityDesc,
      run: () => t.securityBody,
    },
    clear: {
      desc: t.clearDesc,
      run: (term) => {
        term.clear();
      },
    },
    services: {
      desc: t.servicesDesc,
      run: () => t.servicesBody,
    },
  };
}

export class CyberTerminal {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
    this.output = root.querySelector('[data-term-output]');
    this.input = root.querySelector('[data-term-input]') || root.querySelector('#term-input');
    this.form = root.querySelector('[data-term-form]');
    this.busy = false;
    this.history = [];
    this.histIndex = -1;
  }

  init() {
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitCurrent();
    });
    this.input?.addEventListener('keydown', (e) => this.onKey(e));
    this.boot();
  }

  async boot() {
    const boot = i18n.t.term?.boot || CONFIG.terminal.bootLines;
    for (const line of boot) {
      await this.print(line);
      await sleep(180);
    }
  }

  clear() {
    this.output?.replaceChildren();
  }

  async print(text, cls = '') {
    if (!this.output) return;
    const pre = document.createElement('pre');
    pre.className = `term-line ${cls}`.trim();
    pre.textContent = text;
    this.output.appendChild(pre);
    this.output.scrollTop = this.output.scrollHeight;
  }

  async submitCurrent() {
    if (this.busy || !this.input) return;
    const raw = sanitizeText(this.input.value, { maxLength: 120 });
    this.input.value = '';
    if (!raw) return;
    this.history.push(raw);
    this.histIndex = -1;
    await this.exec(raw);
  }

  async onKey(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.history.length) return;
      this.histIndex = Math.min(this.history.length - 1, this.histIndex + 1);
      this.input.value = this.history[this.history.length - 1 - this.histIndex] || '';
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.histIndex = Math.max(-1, this.histIndex - 1);
      this.input.value =
        this.histIndex < 0 ? '' : this.history[this.history.length - 1 - this.histIndex] || '';
    }
  }

  async exec(raw) {
    this.busy = true;
    const prompt = CONFIG.terminal.prompt;
    await this.print(`${prompt} ${raw}`, 'term-cmd');
    const [cmd, ...args] = raw.toLowerCase().split(/\s+/);
    const map = lines();
    const entry = map[cmd];
    if (!entry) {
      await this.print(i18n.t.term.unknown.replace('{cmd}', cmd));
      this.busy = false;
      return;
    }
    try {
      const result = await entry.run(this, args);
      if (typeof result === 'string' && result) await this.print(result);
    } catch {
      await this.print(i18n.t.term.error);
    }
    this.busy = false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
