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
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Boucles',
    seo: {
      title: "Boucles d'oreilles — Heaven's By Elena",
      description: "Boucles d'oreilles délicates et lumineuses, façonnées à la main pour sublimer chaque tenue.",
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Boucles',
    },
  },
  {
    slug: 'colliers',
    label: 'Colliers',
    navLabel: 'COLLIERS',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Colliers',
    seo: {
      title: "Colliers — Heaven's By Elena",
      description: 'Découvrez nos colliers faits main en acier inoxydable, créés avec soin par Elena.',
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Colliers',
    },
  },
  {
    slug: 'parrure',
    label: 'Parure',
    navLabel: 'PARURE',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Parure',
    seo: {
      title: "Parure — Heaven's By Elena",
      description: 'Parures complètes et harmonieuses pour des looks élégants et sophistiqués.',
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Parure',
    },
  },
  {
    slug: 'bougies',
    label: 'Bougies',
    navLabel: 'BOUGIES',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Bougies',
    seo: {
      title: "Bougies — Heaven's By Elena",
      description: 'Bougies parfumées et décoratives, pensées comme des objets de décoration raffinés.',
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Bougies',
    },
  },
  {
    slug: 'lunettes',
    label: 'Lunettes',
    navLabel: 'LUNETTES',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Lunettes',
    seo: {
      title: "Lunettes — Heaven's By Elena",
      description: 'Sélection de lunettes tendance pour compléter votre style avec élégance.',
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Lunettes',
    },
  },
  {
    slug: 'sacs',
    label: 'Sacs à main',
    navLabel: 'SACS À MAIN',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=Sacs',
    seo: {
      title: "Sacs à main — Heaven's By Elena",
      description: 'Sacs à main élégants et intemporels, pensés pour accompagner vos journées et vos soirées.',
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Sacs',
    },
  },
  {
    slug: 'resine',
    label: 'Création Résine',
    navLabel: 'RÉSINE',
    img: 'https://placehold.co/300x400/F5E6E0/8A8A8A?text=R%C3%A9sine',
    seo: {
      title: "Création Résine — Heaven's By Elena",
      description: "Créations artisanales en résine : plateaux, bijoux, décorations, boîtes et plus encore. Chaque pièce est unique, façonnée à la main par Elena.",
      ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=R%C3%A9sine',
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

// Helper : tous les slugs résine (parent + sous-catégories)
export function isResineSlug(slug: string): boolean {
  return slug === 'resine' || slug.startsWith('resine-');
}

// Helper : convertir un slug résine en label affichable
// Cherche d'abord dans la config statique, sinon formate le slug proprement
export function getResineSubcatLabel(slug: string): string {
  const resineCategory = CATEGORIES.find(c => c.slug === 'resine');
  const match = resineCategory?.subcategories?.find(s => s.slug === slug);
  if (match) return match.label;
  // Fallback : "resine-porte-cles" → "Porte Cles"
  return slug
    .replace(/^resine-/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Pour le header : 3 catégories à gauche du logo, 4 à droite
export const NAV_LEFT  = CATEGORIES.slice(0, 3);
export const NAV_RIGHT = CATEGORIES.slice(3);
