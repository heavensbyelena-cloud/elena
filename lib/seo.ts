// ============================================================
// CONSTANTES SEO — Heaven's By Elena
// ============================================================

import { DEFAULT_PUBLIC_SITE_URL } from './site-url';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_SITE_URL;

export const SITE_NAME = "Heaven's By Elena";

export const SEO = {
  home: {
    title: "Heaven's By Elena — Bijoux artisanaux français faits main",
    description:
      "Découvrez les bijoux artisanaux faits main d'Elena : colliers, boucles d'oreilles, décoration artisanale et accessoires uniques. Chaque pièce est façonnée à la main en France, en acier inoxydable, pour un résultat élégant et durable.",
    keywords: [
      'bijoux artisanaux',
      'bijoux faits main',
      'bijoux artisanaux français',
      'créations uniques',
      'décoration artisanale',
      'accessoires déco',
      'acier inoxydable',
      'handmade jewelry',
      'bijoux artisanal France',
      'collier fait main',
      "boucles d'oreilles artisanales",
      "Heaven's By Elena",
    ],
    ogImage: `${SITE_URL}/og-image.jpg`,
  },
  shop: {
    title: "Boutique — Bijoux artisanaux faits main | Heaven's By Elena",
    description:
      "Explorez notre boutique de bijoux artisanaux : colliers, boucles d'oreilles, parures, décoration et accessoires. Pièces uniques faites main en France.",
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
