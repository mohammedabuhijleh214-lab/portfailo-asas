/**
 * Cyber Warden — Application Configuration
 * Authentic content only. No fabricated clients, stats, or credentials.
 * @module config
 */

'use strict';

export const CONFIG = Object.freeze({
  brand: {
    name: 'Cyber Warden',
    fullName: 'Mohammed Abu Hijleh',
    title: 'Freelance Web Developer · Security-Focused',
    tagline: 'Clean code. Secure delivery. Clear communication.',
    url: 'https://mohammedabuhijleh214-lab.github.io/',
  },

  contact: Object.freeze({
    email: 'mohammedabuhijleh214@gmail.com',
    phone: '0779822292',
    phoneDisplay: '+962 779 822 292',
    github: 'https://github.com/mohammedabuhijleh214-lab',
    linkedin: 'https://www.linkedin.com/in/mohammedabuhijleh214',
    discord: 'https://discord.com/users/abuhijleh0887',
  }),

  api: Object.freeze({
    /**
     * Local static preview → auth API on :8787
     * Production behind reverse proxy → '/api/v1'
     */
    baseUrl:
      typeof location !== 'undefined' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? `${location.protocol}//127.0.0.1:8787/api/v1`
        : '/api/v1',
    endpoints: Object.freeze({
      auth: '/auth/login',
      logout: '/auth/logout',
      csrf: '/auth/csrf',
      session: '/auth/session',
      projects: '/projects',
      services: '/services',
      analytics: '/analytics',
      audit: '/audit',
      security: '/security/events',
      visitors: '/visitors',
      backup: '/admin/backup',
      contact: '/contact',
      upload: '/upload',
      health: '/health',
    }),
    timeoutMs: 15000,
    retryAttempts: 2,
    /** Contact & auth always go through Express — never mock credentials in the browser */
    contactLive: true,
  }),

  auth: Object.freeze({
    handshakeMs: 1600,
    sessionKey: 'cw_admin_ui',
    idleTimeoutMs: 30 * 60 * 1000,
  }),

  gift: Object.freeze({
    title: 'Client benefit',
    headline: 'Free monthly security & vulnerability scanning — for life',
    description:
      'After you purchase a website from me, you receive complimentary monthly vulnerability scanning for that site — ongoing, at no extra cost.',
  }),

  /** Soft strengths — not claimed certifications or employment history */
  strengths: Object.freeze([
    { id: 'speed', label: 'Fast, clear delivery', icon: 'bolt' },
    { id: 'quality', label: 'Clean, maintainable code', icon: 'code' },
    { id: 'secure', label: 'Security-minded builds', icon: 'lock' },
    { id: 'detail', label: 'Careful attention to detail', icon: 'eye' },
  ]),

  media: Object.freeze({
    hero:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=72&fm=webp',
  }),

  particles: Object.freeze({
    count: { mobile: 20, desktop: 42 },
    maxVelocity: 0.3,
    connectionDistance: 100,
    mouseRadius: 120,
  }),

  terminal: Object.freeze({
    prompt: 'cyber-warden@secure:~$',
    typeSpeedMs: 12,
    bootLines: [
      'Initializing shell…',
      'Ready. Type "help".',
    ],
  }),

  storage: Object.freeze({
    projectsKey: 'cw_projects_v3',
    servicesKey: 'cw_services_v1',
    analyticsKey: 'cw_analytics_v1',
    auditKey: 'cw_audit_v1',
    visitorsKey: 'cw_visitors_v1',
    localeKey: 'cw_locale',
    soundKey: 'cw_sound',
  }),

  pagination: Object.freeze({ pageSize: 6 }),

  sound: Object.freeze({
    enabledDefault: false,
    volume: 0.08,
  }),
});

/**
 * Sellable services — freelance SMB / personal brand focus.
 * Editable in Admin Dashboard independently from portfolio.
 */
export const SEED_SERVICES = Object.freeze([
  {
    id: 'svc_landing',
    title: 'Secure Landing Page',
    shortDescription: 'A single high-converting page for a product, offer, or personal intro — built with solid basics and security headers.',
    fullDescription:
      'Ideal when you need one polished page online quickly: clear layout, mobile-friendly design, contact or CTA section, and practical security defaults (CSP-minded markup, safe forms).',
    deliverables: [
      '1 responsive landing page',
      'Contact or CTA section',
      'Basic SEO meta tags',
      'Security-conscious markup',
    ],
    price: 180,
    currency: 'USD',
    accent: 'cyan',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=72&fm=webp',
    status: 'published',
    hidden: false,
    featured: false,
    sortOrder: 1,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'svc_portfolio',
    title: 'Personal Brand / Portfolio Site',
    shortDescription: 'A compact multi-section site to present who you are, your work samples, and how to reach you.',
    fullDescription:
      'Built for freelancers and creators who need a trustworthy online presence — about, work samples, and contact — with clean code and security-minded defaults.',
    deliverables: [
      'Multi-section personal site',
      'Work / gallery section',
      'Contact channels',
      'Mobile-optimized layout',
    ],
    price: 320,
    currency: 'USD',
    accent: 'violet',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=72&fm=webp',
    status: 'published',
    hidden: false,
    featured: true,
    sortOrder: 2,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'svc_business',
    title: 'Small Business Website',
    shortDescription: 'A practical multi-page site for a local business or personal brand (home, services, about, contact).',
    fullDescription:
      'A straightforward website for small and medium businesses — clear structure, readable content areas, contact form hookup-ready, and hardening basics suitable for a public marketing site.',
    deliverables: [
      'Up to 5 pages',
      'Services / offers section',
      'Contact form structure',
      'Responsive design + basic SEO',
    ],
    price: 480,
    currency: 'USD',
    accent: 'gold',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=72&fm=webp',
    status: 'published',
    hidden: false,
    featured: false,
    sortOrder: 3,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'svc_hardening',
    title: 'Website Security Check & Hardening',
    shortDescription: 'A focused review of an existing site: headers, common risks, and practical fixes you can apply.',
    fullDescription:
      'For site owners who already have a website and want a clearer security baseline — review of headers/CSP opportunities, common front-end risks, and a simple remediation checklist. Not a formal enterprise audit.',
    deliverables: [
      'Front-end security review notes',
      'Header / CSP recommendations',
      'Prioritized fix list',
      'Optional apply-fixes pass (if agreed)',
    ],
    price: 220,
    currency: 'USD',
    accent: 'emerald',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=72&fm=webp',
    status: 'published',
    hidden: false,
    featured: false,
    sortOrder: 4,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
]);

/**
 * Portfolio demos only — skill showcases, not products for sale.
 */
export const SEED_PROJECTS = Object.freeze([
  {
    id: 'proj_cyber_portfolio',
    title: 'Cyber Portfolio & Tech Stack Showcase',
    shortDescription:
      'A personal portfolio demo focused on modern front-end structure, performance-minded UI, and security-conscious markup.',
    fullDescription:
      'A demonstration project showing how I organize HTML/CSS/JavaScript for a personal portfolio: modular files, accessible structure, and browser security basics. This is previous work / a skill sample — not a product package for sale.',
    features: [
      'Modular front-end structure',
      'Responsive layout',
      'Interactive UI sections',
      'SEO-friendly semantic markup',
    ],
    securityFeatures: [
      'Content Security Policy minded setup',
      'Safe dynamic content handling',
      'Clickjacking-aware framing policy',
    ],
    technologies: ['HTML5', 'CSS3', 'Vanilla JS (ES6+)', 'GitHub Pages'],
    architecture:
      'Static modular front-end with clear separation of config, UI, and interaction scripts.',
    challenges: 'Keeping the UI expressive while staying fast and readable on mobile.',
    solutions: 'Lean assets, CSS-driven motion where possible, and progressive enhancement.',
    liveUrl: 'https://mohammedabuhijleh214-lab.github.io/portfolia/',
    githubUrl: 'https://github.com/mohammedabuhijleh214-lab',
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=72&fm=webp',
    gallery: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=72&fm=webp',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=72&fm=webp',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=72&fm=webp',
    ],
    mockups: {
      desktop:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=72&fm=webp',
      tablet:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=72&fm=webp',
      mobile:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=72&fm=webp',
    },
    price: '',
    status: 'published',
    hidden: false,
    featured: true,
    accent: 'cyan',
    createdAt: '2025-11-12T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'proj_aura_dental',
    title: 'Aura Dental Luxury',
    shortDescription:
      'A luxury dental clinic demo site with interactive UI (including a Smile Simulator concept) and CSP-minded hardening.',
    fullDescription:
      'A demonstration of a polished clinic-style marketing site: modern UI, 3D card tilt interactions, and a Smile Simulator feature concept. Built to show design and front-end skill — not sold as a packaged product here.',
    features: [
      'Smile Simulator interaction',
      '3D card tilt effects',
      'Modern responsive UI',
      'Contact-oriented layout',
    ],
    securityFeatures: [
      'Content Security Policy (CSP)',
      'Careful external resource loading',
      'Form input validation patterns',
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'CSS 3D Transforms', 'CSP'],
    architecture: 'Section-based front-end with isolated interaction modules.',
    challenges: 'Balancing interactive effects with accessibility and security headers.',
    solutions: 'Respect reduced-motion preferences and keep CSP allowlists tight.',
    liveUrl: 'https://mohammedabuhijleh214-lab.github.io/aura-dental-luxury/',
    githubUrl: 'https://github.com/mohammedabuhijleh214-lab',
    imageUrl:
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=72&fm=webp',
    gallery: [
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=72&fm=webp',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=72&fm=webp',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=72&fm=webp',
    ],
    mockups: {
      desktop:
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=72&fm=webp',
      tablet:
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=72&fm=webp',
      mobile:
        'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=72&fm=webp',
    },
    beforeAfter: null,
    price: '',
    status: 'published',
    hidden: false,
    featured: true,
    accent: 'violet',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
  },
]);

export const COLORS = Object.freeze({
  midnight: '#020407',
  cyan: '#61F8FF',
  gold: '#FFE3A2',
});
