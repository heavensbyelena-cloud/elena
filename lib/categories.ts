// ============================================================
// CONFIGURATION CENTRALE DES CATÉGORIES — Heaven's By Elena
// Modifier uniquement ce fichier pour ajouter/modifier des catégories
// ============================================================

export interface Subcategory {
  slug: string;
  label: string;
}

export interface CategoryDef {
  slug: string;
  label: string;
  navLabel: string;
  img: string;
  /** contain = photo entière visible (ex. visuels paysage) ; défaut cover */
  imgObjectFit?: 'cover' | 'contain';
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  subcategories?: Subcategory[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'boucles',
    label: "Boucles d'oreilles",
    navLabel: "BOUCLES D'OREILLES",
    img: '/categories/boucles.png',
    seo: {
      title: "Boucles d'oreilles — Heaven's By Elena",
      description: "Boucles d'oreilles délicates et lumineuses, façonnées à la main pour sublimer chaque tenue.",
      ogImage: '/categories/boucles.png',
    },
  },
  {
    slug: 'colliers',
    label: 'Colliers',
    navLabel: 'COLLIERS',
    img: '/categories/colliers.png',
    seo: {
      title: "Colliers — Heaven's By Elena",
      description: 'Découvrez nos colliers faits main en acier inoxydable, créés avec soin par Elena.',
      ogImage: '/categories/colliers.png',
    },
  },
  {
    slug: 'bague',
    label: 'Bagues',
    navLabel: 'BAGUES',
    img: '/categories/bague.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Bagues — Heaven's By Elena",
      description:
        "Bagues en acier inoxydable, pierres et émail : des pièces raffinées pour chaque doigt, façonnées avec soin.",
      ogImage: '/categories/bague.png',
    },
  },
  {
    slug: 'bracelets',
    label: 'Bracelets',
    navLabel: 'BRACELETS',
    img: '/categories/bracelets.png',
    seo: {
      title: "Bracelets — Heaven's By Elena",
      description:
        "Bracelets perles, charms et finitions nacrées : des créations délicates à porter seules ou en accumulation.",
      ogImage: '/categories/bracelets.png',
    },
  },
  {
    slug: 'parrure',
    label: 'Parure',
    navLabel: 'PARURE',
    img: '/categories/parrure.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Parure — Heaven's By Elena",
      description: 'Parures complètes et harmonieuses pour des looks élégants et sophistiqués.',
      ogImage: '/categories/parrure.png',
    },
  },
  {
    slug: 'bougies',
    label: 'Bougies',
    navLabel: 'BOUGIES',
    img: '/categories/bougies.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Bougies — Heaven's By Elena",
      description: 'Bougies parfumées et décoratives, pensées comme des objets de décoration raffinés.',
      ogImage: '/categories/bougies.png',
    },
  },
  {
    slug: 'lunettes',
    label: 'Lunettes',
    navLabel: 'LUNETTES',
    img: '/categories/lunettes.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Lunettes — Heaven's By Elena",
      description: 'Sélection de lunettes tendance pour compléter votre style avec élégance.',
      ogImage: '/categories/lunettes.png',
    },
  },
  {
    slug: 'sacs',
    label: 'Sacs à main',
    navLabel: 'SACS À MAIN',
    img: '/categories/sacs.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Sacs à main — Heaven's By Elena",
      description: 'Sacs à main élégants et intemporels, pensés pour accompagner vos journées et vos soirées.',
      ogImage: '/categories/sacs.png',
    },
  },
  {
    slug: 'homme',
    label: 'Homme',
    navLabel: 'HOMME',
    img: '/categories/homme-bracelets-bois.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Homme — Heaven's By Elena",
      description:
        'Sélection de bijoux et accessoires pour lui : pièces sobres, robustes et élégantes, pensées pour un style affirmé au quotidien.',
      ogImage: '/categories/homme-bracelets-bois.png',
    },
  },
  {
    slug: 'enfant',
    label: 'Enfant',
    navLabel: 'ENFANT',
    img: '/categories/enfant-collage-licorne.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Enfant — Heaven's By Elena",
      description:
        'Bijoux et petites créations pour les enfants : formats adaptés, couleurs joyeuses et finitions soignées, toujours pensés avec douceur.',
      ogImage: '/categories/enfant-collage-licorne.png',
    },
  },
  {
    slug: 'decoration',
    label: 'Décoration',
    navLabel: 'DÉCORATION',
    img: '/categories/decoration.png',
    imgObjectFit: 'contain',
    seo: {
      title: "Décoration — Heaven's By Elena",
      description:
        "Décoration et créations artisanales : plateaux, bijoux, objets déco, boîtes et plus encore. Chaque pièce est unique, façonnée à la main par Elena.",
      ogImage: '/categories/decoration.png',
    },
    // Pas de sous-catégories statiques — tout est dynamique depuis les produits en base
  },
];

// Slugs de toutes les catégories (pour TypeScript)
export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug);

// Helper : récupérer une catégorie par son slug
export function getCategoryBySlug(slug: string): CategoryDef | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

// Helper : tous les slugs décoration (parent + sous-catégories dynamiques decoration-*)
export function isDecorationSlug(slug: string): boolean {
  return slug === 'decoration' || slug.startsWith('decoration-');
}

// Helper : convertir un slug decoration-* en label affichable
// Cherche d'abord dans la config statique, sinon formate le slug proprement
export function getDecorationSubcatLabel(slug: string): string {
  const decoCategory = CATEGORIES.find(c => c.slug === 'decoration');
  const match = decoCategory?.subcategories?.find(s => s.slug === slug);
  if (match) return match.label;
  // Fallback : "decoration-porte-cles" → "Porte Cles"
  return slug
    .replace(/^decoration-/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Pour le header : 3 catégories à gauche du logo, le reste à droite
export const NAV_LEFT  = CATEGORIES.slice(0, 3);
export const NAV_RIGHT = CATEGORIES.slice(3);
