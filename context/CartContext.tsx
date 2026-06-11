'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AppliedPromo, CartItem as CartItemType } from '@/types';
import {
  clampToStock,
  hasAvailableStock,
  maxCartQuantity,
  type CartStockResult,
} from '@/lib/cart-stock';
import { normalizeProductId } from '@/lib/utils';

/* ── Types ───────────────────────────────────────────── */
interface CartContextValue {
  items: CartItemType[];
  count: number;
  total: number;
  appliedPromo: AppliedPromo | null;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** API historique */
  addItem: (item: Omit<CartItemType, 'qty'>) => CartStockResult;
  removeItem: (id: string) => void;
  /** Nouvelle API plus explicite */
  addToCart: (item: Omit<CartItemType, 'qty'>, quantity?: number) => CartStockResult;
  removeFromCart: (id: string) => void;
  /** Retourne false si la quantité demandée dépasse le stock */
  updateQuantity: (id: string, quantity: number) => boolean;
  clearCart: () => void;
}

/* ── Context ─────────────────────────────────────────── */
const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'heavens_cart';
const PROMO_KEY = 'heavens_promo';
const AUTH_ME_ENDPOINT = '/api/auth/me';
const CART_ADD_ENDPOINT = '/api/cart/add';
const CART_REMOVE_ENDPOINT = '/api/cart/remove';
const CART_CLEAR_ENDPOINT = '/api/cart/clear';
const CART_SYNC_ENDPOINT = '/api/cart/sync';

/* ── Provider ────────────────────────────────────────── */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [appliedPromo, setAppliedPromoState] = useState<AppliedPromo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const stockRefreshStarted = useRef(false);

  // Marquer quand on est bien côté client (évite tout accès localStorage/document côté SSR)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Charger depuis localStorage au montage
  useEffect(() => {
    if (!isClient) return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* panier corrompu → on repart de zéro */ }
    try {
      const promoRaw = localStorage.getItem(PROMO_KEY);
      if (promoRaw) setAppliedPromoState(JSON.parse(promoRaw));
    } catch { /* promo corrompue */ }
  }, [isClient]);

  // Compléter le stock depuis l’API pour les paniers localStorage sans stock
  useEffect(() => {
    if (!isClient || items.length === 0 || stockRefreshStarted.current) return;
    if (!items.some((i) => i.stock === undefined)) return;

    stockRefreshStarted.current = true;
    let cancelled = false;

    void fetch('/api/products?limit=200')
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products?: Array<{ id: unknown; stock?: number | null }> }) => {
        if (cancelled) return;
        const stockById = new Map(
          (data.products ?? []).map((p) => [normalizeProductId(p.id), p.stock ?? null])
        );
        setItems((prev) =>
          prev.map((item) => {
            const stock = stockById.get(normalizeProductId(item.id)) ?? item.stock ?? null;
            return {
              ...item,
              stock,
              qty: clampToStock(item.qty, stock),
            };
          })
        );
      })
      .catch(() => {
        stockRefreshStarted.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [isClient, items.length]);

  const setAppliedPromo = useCallback((promo: AppliedPromo | null) => {
    setAppliedPromoState(promo);
    try {
      if (promo) localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
      else localStorage.removeItem(PROMO_KEY);
    } catch { /* ignore */ }
  }, []);

  // Détecter si l'utilisateur est connecté et, si oui, fusionner le panier local → Supabase
  useEffect(() => {
    let cancelled = false;

    async function initAuthAndSync() {
      try {
        const res = await fetch(AUTH_ME_ENDPOINT, { method: 'GET', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.user) return;

        if (cancelled) return;
        setIsAuthenticated(true);

        // Envoyer le panier local pour fusionner dans Supabase
        const currentItems: CartItemType[] = (() => {
          try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        if (currentItems.length === 0) return;

        const payload = {
          items: currentItems.map((it) => ({
            product_id: it.id,
            quantity: it.qty,
          })),
        };

        const syncRes = await fetch(CART_SYNC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!syncRes.ok) return;
        const syncData = await syncRes.json();
        if (!cancelled && Array.isArray(syncData.items)) {
          setItems(syncData.items as CartItemType[]);
        }
      } catch {
        // En cas d'erreur, on reste en mode invité (localStorage uniquement)
      }
    }

    void initAuthAndSync();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch { /* localStorage plein ou désactivé */ }
  }, [items, isClient]);

  // Bloquer le scroll quand la sidebar est ouverte
  useEffect(() => {
    if (!isClient) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isClient]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback(
    (product: Omit<CartItemType, 'qty'>, quantity = 1): CartStockResult => {
      if (quantity <= 0) return 'out_of_stock';

      const stock = product.stock;
      if (!hasAvailableStock(stock)) return 'out_of_stock';

      let result: CartStockResult = 'added';

      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        const effectiveStock = stock ?? existing?.stock ?? null;
        const currentQty = existing?.qty ?? 0;
        const max = maxCartQuantity(effectiveStock);

        if (max === 0) {
          result = 'out_of_stock';
          return prev;
        }

        const requested = currentQty + quantity;
        const nextQty = clampToStock(requested, effectiveStock);

        if (nextQty <= 0) {
          result = 'out_of_stock';
          return prev;
        }

        if (nextQty < requested || (max !== null && currentQty >= max)) {
          result = 'stock_limit';
        }

        if (existing) {
          return prev.map((i) =>
            i.id === product.id
              ? { ...i, ...product, stock: effectiveStock, qty: nextQty }
              : i
          );
        }

        return [...prev, { ...product, stock: effectiveStock, qty: nextQty }];
      });

      if (isAuthenticated) {
        void fetch(CART_ADD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: product.id, quantity }),
        }).catch(() => {});
      }

      return result;
    },
    [isAuthenticated]
  );

  const removeFromCart = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (isAuthenticated) {
        void fetch(CART_REMOVE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: id }),
        }).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number): boolean => {
      let allowed = true;
      let cappedQty = 0;

      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;

        cappedQty = clampToStock(quantity, item.stock);
        if (quantity > cappedQty) allowed = false;

        if (cappedQty <= 0) {
          return prev.filter((i) => i.id !== id);
        }

        return prev.map((i) => (i.id === id ? { ...i, qty: cappedQty } : i));
      });

      if (isAuthenticated) {
        if (quantity <= 0) {
          void fetch(CART_REMOVE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: id }),
          }).catch(() => {});
        } else if (cappedQty > 0) {
          void fetch(CART_SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              items: [{ product_id: id, quantity: cappedQty }],
            }),
          }).catch(() => {});
        }
      }

      return allowed;
    },
    [isAuthenticated]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedPromo(null);
    stockRefreshStarted.current = false;
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // ignore
    }

    if (isAuthenticated) {
      void fetch(CART_CLEAR_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    }
  }, [isAuthenticated, setAppliedPromo]);

  // Aliases pour compatibilité avec l'existant
  const addItem = useCallback(
    (item: Omit<CartItemType, 'qty'>) => addToCart(item, 1),
    [addToCart]
  );

  const removeItem = useCallback(
    (id: string) => removeFromCart(id),
    [removeFromCart]
  );

  return (
    <CartContext.Provider value={{
      items,
      count,
      total,
      appliedPromo,
      setAppliedPromo,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

/* ── Hook ────────────────────────────────────────────── */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
