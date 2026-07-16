/**
 * Cyber Warden — Optional subtle Web Audio sound design
 * Muted by default. No external audio files required.
 * @module sound
 */

'use strict';

import { CONFIG } from './config.js';

export class SoundDesign {
  constructor() {
    const saved = localStorage.getItem(CONFIG.storage.soundKey);
    this.enabled = saved === '1' ? true : CONFIG.sound.enabledDefault;
    this.ctx = null;
  }

  async ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on) {
    this.enabled = Boolean(on);
    localStorage.setItem(CONFIG.storage.soundKey, this.enabled ? '1' : '0');
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.play('ui');
    return this.enabled;
  }

  /**
   * @param {'ui'|'success'|'scan'|'hover'} type
   */
  async play(type = 'ui') {
    if (!this.enabled) return;
    const ctx = await this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;

    const profiles = {
      ui: { f: 680, t: 0.07, type: 'sine' },
      hover: { f: 520, t: 0.04, type: 'triangle' },
      success: { f: 880, t: 0.14, type: 'sine' },
      scan: { f: 240, t: 0.22, type: 'sawtooth' },
    };
    const p = profiles[type] || profiles.ui;
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f, now);
    if (type === 'success') osc.frequency.exponentialRampToValueAtTime(p.f * 1.35, now + p.t);
    if (type === 'scan') osc.frequency.exponentialRampToValueAtTime(p.f * 3, now + p.t);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(CONFIG.sound.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.t + 0.02);
  }
}

export const sound = new SoundDesign();
