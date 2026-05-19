// ============================================================
// JSON-LD SCHEMAS — Heaven's By Elena
// Schema.org structured data pour le SEO
// ============================================================

import { SITE_URL, SITE_NAME } from './seo';

/** Schema Organization — identité de la marque */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Créatrice de bijoux artisanaux faits main en France. Colliers, boucles d'oreilles, décoration artisanale et accessoires uniques en matériaux nobles.",
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'FR',
    },
    sameAs: [
      'https://www.instagram.com/heavensbyelena',
    ],
  };
}

/** Schema WebSite — moteur de recherche interne */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Schema LocalBusiness — référencement local */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      "Bijoux artisanaux français faits main. Créations uniques en matériaux nobles et décoration artisanale.",
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'FR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  };
}

/** Schema Product — fiche produit */
export function productSchema(product: {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  badge?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? `${product.name} — création artisanale faite main par Elena.`,
    image: product.image_url,
    url: `${SITE_URL}/product/${product.id}`,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };
}

/** Sérialise un schema en balise <script> JSON-LD */
export function jsonLd(schema: object): string {
  return JSON.stringify(schema);
}
