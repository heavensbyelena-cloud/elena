// ============================================================
// TYPES TYPESCRIPT — Heaven's By Elena
// ============================================================

// ---------- PRODUIT ----------
export type ProductMaterial = 'acier-inoxydable' | 'alliage' | 'epoxy';

export type ProductCategory =
  | 'colliers'
  | 'boucles'
  | 'bague'
  | 'bracelets'
  | 'parrure'
  | 'bougies'
  | 'lunettes'
  | 'sacs'
  | 'homme'
  | 'enfant'
  | 'decoration'
  | 'decoration-plateaux'
  | 'decoration-bijoux'
  | 'decoration-deco'
  | 'decoration-boites'
  | 'decoration-portecles'
  | 'decoration-perso';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  /**
   * Catégorie technique (slug) stockée en base.
   * La décoration et sous-rayons : slugs préfixés decoration-plateaux, decoration-bijoux, etc.
   */
  category: ProductCategory;
  /** Matériaux cumulables (acier inoxydable, alliage, époxy). */
  materials?: ProductMaterial[];
  badge?: string;
  image_url: string;
  images?: string[];
  stock?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'colliers',
  'boucles',
  'bague',
  'bracelets',
  'parrure',
  'bougies',
  'lunettes',
  'sacs',
  'homme',
  'enfant',
  'decoration',
  'decoration-plateaux',
  'decoration-bijoux',
  'decoration-deco',
  'decoration-boites',
  'decoration-portecles',
  'decoration-perso',
];

// ---------- PANIER ----------
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  qty: number;
}

export interface CartState {
  items: CartItem[];
  count: number;
  total: number;
}

// ---------- COMMANDE ----------
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  qty: number;
  image_url?: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  user_id?: string;
  customer_email: string;
  customer_name?: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_cost: number;
  /** Montant total (colonne total_price en base) */
  total_price?: number;
  /** @deprecated Utiliser total_price. Conservé pour compat. */
  total?: number;
  status: OrderStatus;
  payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ---------- AVIS ----------
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  product_id?: string;
  rating: number;
  comment: string;
  author_name?: string;
  status?: ReviewStatus;
  created_at: string;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ---------- UTILISATEUR ----------
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  default_address?: ShippingAddress;
  is_admin?: boolean;
  /** Rôle pour la protection admin (prioritaire sur is_admin) */
  role?: UserRole;
  created_at?: string;
}

// ---------- API RESPONSES ----------
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ---------- FORMULAIRES ----------
export interface ReviewFormData {
  rating: number;
  comment: string;
  author_name?: string;
}

export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

// ---------- CODES PROMO ----------
export interface PromoCode {
  id: string;
  code: string;
  type: 'percent';
  value: number;
  min_order: number | null;
  max_uses: number | null;
  uses_count: number;
  is_personal: boolean;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  assigned_users?: PromoCodeUser[];
}

export interface PromoCodeUser {
  id: string;
  promo_code_id: string;
  user_id: string;
  max_uses: number;
  uses_count: number;
  profile?: { email: string; first_name?: string; last_name?: string };
}

export interface AppliedPromo {
  id: string;
  code: string;
  value: number;
  discount_amount: number;
}
