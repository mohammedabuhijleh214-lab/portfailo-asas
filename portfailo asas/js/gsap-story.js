/**
 * Cyber Warden — GSAP scroll storytelling (CDN progressive enhancement)
 * @module gsap-story
 */

'use strict';

let gsapPromise;

export function loadGsap() {
  if (gsapPromise) return gsapPromise;
  gsapPromise = new Promise((resolve) => {
    if (window.gsap && window.ScrollTrigger) {
      resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });
      return;
    }
    const g = document.createElement('script');
    g.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    g.async = true;
    g.onload = () => {
      const st = document.createElement('script');
      st.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';
      st.async = true;
      st.onload = () =>
        resolve(
          window.gsap && window.ScrollTrigger
            ? { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger }
            : null
        );
      st.onerror = () => resolve(null);
      document.head.appendChild(st);
    };
    g.onerror = () => resolve(null);
    document.head.appendChild(g);
  });
  return gsapPromise;
}

/**
 * Initialize cinematic scroll scenes. Falls back to CSS .reveal if GSAP unavailable.
 */
export async function initGsapStory() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const libs = await loadGsap();
  if (!libs) return false;

  const { gsap, ScrollTrigger } = libs;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('[data-gsap-fade]').forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 48 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  });

  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const speed = Number(el.getAttribute('data-parallax')) || 40;
    gsap.to(el, {
      y: speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  const pin = document.querySelector('[data-story-pin]');
  if (pin) {
    const panels = pin.querySelectorAll('[data-story-panel]');
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        pin: true,
        scrub: 1,
        end: () => `+=${pin.offsetWidth}`,
        anticipatePin: 1,
      },
    });
  }

  document.querySelectorAll('[data-holo-card]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--hx', `${x}%`);
      card.style.setProperty('--hy', `${y}%`);
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  // Liquid morph path on gift section
  const morph = document.querySelector('[data-morph-path]');
  if (morph) {
    gsap.to(morph, {
      attr: {
        d: 'M0,160 C120,40 240,280 360,160 C480,40 600,280 720,160 L720,320 L0,320 Z',
      },
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  return true;
}
