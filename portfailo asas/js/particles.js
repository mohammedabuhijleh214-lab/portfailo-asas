/**
 * Cyber Warden — Canvas Particle Field
 * Hardware-accelerated, DPR-aware, reduced-motion safe.
 * @module particles
 */

'use strict';

import { CONFIG } from './config.js';

/**
 * @typedef {{ x: number, y: number, vx: number, vy: number, r: number, a: number }} Particle
 */

export class ParticleSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    /** @type {Particle[]} */
    this.particles = [];
    this.mouse = { x: -9999, y: -9999, active: false };
    this.raf = 0;
    this.running = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._onResize = this.resize.bind(this);
    this._onMove = this.onPointerMove.bind(this);
    this._onLeave = this.onPointerLeave.bind(this);
  }

  init() {
    if (!this.ctx || this.reducedMotion) {
      this.canvas.style.display = 'none';
      return;
    }
    this.resize();
    this.spawn();
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('pointerleave', this._onLeave, { passive: true });
    this.running = true;
    this.loop();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerleave', this._onLeave);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { innerWidth: w, innerHeight: h } = window;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
  }

  spawn() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const count = isMobile ? CONFIG.particles.count.mobile : CONFIG.particles.count.desktop;
    const { maxVelocity } = CONFIG.particles;
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * maxVelocity,
      vy: (Math.random() - 0.5) * maxVelocity,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.15,
    }));
  }

  onPointerMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
  }

  onPointerLeave() {
    this.mouse.active = false;
  }

  loop() {
    if (!this.running) return;
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const { ctx, width, height, particles, mouse } = this;
    const dist = CONFIG.particles.connectionDistance;
    const mRadius = CONFIG.particles.mouseRadius;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < mRadius && d > 0.01) {
          const force = (mRadius - d) / mRadius;
          p.vx += (dx / d) * force * 0.04;
          p.vy += (dy / d) * force * 0.04;
        }
      }

      const speed = Math.hypot(p.vx, p.vy);
      if (speed > CONFIG.particles.maxVelocity * 2) {
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(97, 248, 255, ${p.a})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < dist) {
          const alpha = (1 - d / dist) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255, 227, 162, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
      g.addColorStop(0, 'rgba(97, 248, 255, 0.12)');
      g.addColorStop(0.45, 'rgba(255, 227, 162, 0.04)');
      g.addColorStop(1, 'rgba(2, 4, 7, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(mouse.x - 180, mouse.y - 180, 360, 360);
    }
  }
}
