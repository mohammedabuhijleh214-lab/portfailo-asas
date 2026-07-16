/**
 * Cyber Warden — Immersive WebGL / Three.js background
 * Progressive: falls back silently if Three fails to load.
 * @module three-bg
 */

'use strict';

/**
 * Dynamically load Three.js from CDN (single shared promise).
 * @returns {Promise<typeof import('three') | null>}
 */
let threePromise;

export function loadThree() {
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    s.async = true;
    s.onload = () => resolve(window.THREE || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return threePromise;
}

export class NeuralField {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.raf = 0;
    this.pointer = { x: 0, y: 0 };
  }

  async init() {
    if (this.reduced || window.matchMedia('(max-width: 768px)').matches) {
      this.canvas.hidden = true;
      return false;
    }
    const THREE = await loadThree();
    if (!THREE) {
      this.canvas.hidden = true;
      return false;
    }

    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 28;

    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      [0.38, 0.97, 1],
      [1, 0.89, 0.64],
      [0.66, 0.33, 0.97],
      [0.2, 0.83, 0.6],
      [0.23, 0.51, 0.96],
    ];

    for (let i = 0; i < count; i += 1) {
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[i % palette.length];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);

    // Holographic torus knot wireframe
    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(6.5, 0.18, 180, 16),
      new THREE.MeshBasicMaterial({
        color: 0x61f8ff,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      })
    );
    this.torus = torus;
    this.scene.add(torus);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(10, 0.05, 8, 100),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.25,
      })
    );
    ring.rotation.x = Math.PI / 2.4;
    this.ring = ring;
    this.scene.add(ring);

    this._onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    };
    this._onMove = (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('pointermove', this._onMove, { passive: true });
    this.clock = new THREE.Clock();
    this.loop();
    return true;
  }

  loop() {
    const t = this.clock.getElapsedTime();
    this.points.rotation.y = t * 0.05 + this.pointer.x * 0.15;
    this.points.rotation.x = t * 0.03 + this.pointer.y * 0.1;
    this.torus.rotation.x = t * 0.2;
    this.torus.rotation.y = t * 0.15;
    this.ring.rotation.z = t * 0.08;
    this.camera.position.x += (this.pointer.x * 2 - this.camera.position.x) * 0.04;
    this.camera.position.y += (this.pointer.y * 1.5 - this.camera.position.y) * 0.04;
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
    this.renderer?.dispose();
  }
}
