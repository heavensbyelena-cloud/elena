// ============================================================
// CONSTANTES SEO — Heaven's By Elena
// ============================================================

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://heavens-by-elena.com';

export const SITE_NAME = "Heaven's By Elena";

export const SEO = {
  home: {
    title: "Heaven's By Elena — Bijoux artisanaux français faits main",
    description:
      "Découvrez les bijoux artisanaux faits main d'Elena : colliers, boucles d'oreille, créations en résine et accessoires uniques. Chaque pièce est façonnée à la main en France, en gold filled et argent sterling, pour un résultat élégant et durable.",
    keywords: [
      'bijoux artisanaux',
      'bijoux faits main',
      'bijoux artisanaux français',
      'créations uniques',
      'bijoux résine',
      'accessoires résine',
      'gold filled',
      'argent sterling',
      'handmade jewelry',
      'bijoux artisanal France',
      'collier fait main',
      'boucles oreilles artisanales',
      "Heaven's By Elena",
    ],
    ogImage: `${SITE_URL}/og-image.jpg`,
  },
  shop: {
    title: "Boutique — Bijoux artisanaux faits main | Heaven's By Elena",
    description:
      "Explorez notre boutique de bijoux artisanaux : colliers, boucles d'oreille, parures, créations en résine et accessoires. Pièces uniques faites main en France.",
    keywords: [
      'boutique bijoux artisanaux',
      'acheter bijoux faits main',
      'bijoux artisanaux en ligne',
    ],
    ogImage: `${SITE_URL}/og-shop.jpg`,
  },
} as const;

export const OPEN_GRAPH_DEFAULTS = {
  siteName: SITE_NAME,
  locale: 'fr_FR',
  type: 'website' as const,
};

export const TWITTER_DEFAULTS = {
  card: 'summary_large_image' as const,
  site: '@heavensbyelena',
};
