/**
 * Image URL optimization (Unsplash → WebP + sized variants)
 * @module media
 */

'use strict';

/**
 * @param {string} url
 * @param {{ w?: number, q?: number, h?: number }} [opts]
 */
export function optimizeImageUrl(url, opts = {}) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (!u.hostname.includes('images.unsplash.com')) return raw;
    const w = opts.w || 1200;
    const q = opts.q || 72;
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('w', String(w));
    u.searchParams.set('q', String(q));
    u.searchParams.set('fm', 'webp');
    if (opts.h) u.searchParams.set('h', String(opts.h));
    return u.href;
  } catch {
    return raw;
  }
}

/**
 * Build srcset for responsive Unsplash images
 * @param {string} url
 * @param {number[]} widths
 */
export function buildSrcSet(url, widths = [640, 960, 1280, 1600]) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (!u.hostname.includes('images.unsplash.com')) return '';
    return widths
      .map((w) => `${optimizeImageUrl(raw, { w })} ${w}w`)
      .join(', ');
  } catch {
    return '';
  }
}
