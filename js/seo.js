/**
 * Schema.org JSON-LD — authentic fields only
 * @module seo
 */

'use strict';

import { CONFIG, SEED_SERVICES } from './config.js';

export function injectStructuredData() {
  const base = CONFIG.brand.url.replace(/\/$/, '');
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${base}/#person`,
        name: CONFIG.brand.fullName,
        alternateName: CONFIG.brand.name,
        url: base,
        email: `mailto:${CONFIG.contact.email}`,
        telephone: `+962${CONFIG.contact.phone}`,
        jobTitle: CONFIG.brand.title,
        sameAs: [CONFIG.contact.github, CONFIG.contact.linkedin, CONFIG.contact.discord],
        image: CONFIG.media.hero,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: CONFIG.brand.name,
        description: CONFIG.brand.tagline,
        inLanguage: ['en', 'ar'],
        publisher: { '@id': `${base}/#person` },
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${base}/#service`,
        name: CONFIG.brand.name,
        url: base,
        image: CONFIG.media.hero,
        description: CONFIG.brand.tagline,
        provider: { '@id': `${base}/#person` },
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Arabic'],
      },
      {
        '@type': 'OfferCatalog',
        name: 'Web development services',
        itemListElement: SEED_SERVICES.map((s, i) => ({
          '@type': 'Offer',
          position: i + 1,
          name: s.title,
          description: s.shortDescription,
          price: s.price,
          priceCurrency: s.currency || 'USD',
          url: `${base}/#services`,
        })),
      },
    ],
  };

  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}
