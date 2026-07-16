/**
 * Accessibility helpers — focus trap, announcer, keyboard
 * @module a11y
 */

'use strict';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap focus inside a dialog while open.
 * @param {HTMLElement} container
 * @returns {() => void} release
 */
export function trapFocus(container) {
  const previouslyFocused = document.activeElement;
  const nodes = () =>
    [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );

  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const list = nodes();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKey);
  const first = nodes()[0];
  first?.focus();

  return () => {
    container.removeEventListener('keydown', onKey);
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  };
}

export function announce(message) {
  const el = document.getElementById('a11y-announcer');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = String(message || '');
  });
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
