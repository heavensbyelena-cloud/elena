import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// CLASSES CSS
// ============================================================

/** Fusionne des classes Tailwind sans conflits */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// FORMATAGE
// ============================================================

/** Formate un prix en euros français — ex: 65,00 € */
export function formatPrice(price: number): string {
  return (
    price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  );
}

/** Traduit un statut de commande technique en libellé français lisible */
export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  };
  return map[status] ?? status;
}

/** Formate une date en français — ex: 15 janvier 2025 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ============================================================
// PANIER
// ============================================================

/** Calcule le total d'un panier */
export function calcCartTotal(items: Array<{ price: number; qty: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Calcule le nombre total d'articles */
export function calcCartCount(items: Array<{ qty: number }>): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/** Seuil panier (€) pour la livraison offerte */
export const FREE_SHIPPING_THRESHOLD = 45;

/** Frais de livraison standard (€) */
export const STANDARD_SHIPPING_COST = 3.99;

/** Calcule les frais de livraison (offerts dès FREE_SHIPPING_THRESHOLD) */
export function calcShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
}

// ============================================================
// AVIS
// ============================================================

/** Génère une chaîne d'étoiles — ex: ★★★★☆ */
export function starsHTML(rating: number): string {
  const r = Math.round(Math.max(0, Math.min(5, rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

/** Calcule la note moyenne d'une liste d'avis */
export function calcAverage(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

// ============================================================
// SÉCURITÉ
// ============================================================

/** Échappe les caractères HTML dangereux */
export function sanitize(str: string): string {
  return str.replace(/[<>'"&]/g, (c) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;',
    };
    return map[c] ?? c;
  });
}

/** Valide un format email basique */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// DIVERS
// ============================================================

/** Tronque un texte avec ellipse */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/** Génère un slug URL depuis un nom */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

