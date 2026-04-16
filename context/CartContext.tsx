'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppliedPromo, CartItem as CartItemType } from '@/types';

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
  addItem: (item: Omit<CartItemType, 'qty'>) => void;
  removeItem: (id: string) => void;
  /** Nouvelle API plus explicite */
  addToCart: (item: Omit<CartItemType, 'qty'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
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
    (product: Omit<CartItemType, 'qty'>, quantity = 1) => {
      if (quantity <= 0) return;

      // Mise à jour optimiste du panier local
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + quantity } : i
          );
        }
        return [...prev, { ...product, qty: quantity }];
      });

      // Réplication dans Supabase si l'utilisateur est connecté
      if (isAuthenticated) {
        void fetch(CART_ADD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: product.id, quantity }),
        }).catch(() => {
          // on garde le panier local même si l'appel échoue
        });
      }
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
    (id: string, quantity: number) => {
      setItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((i) => i.id !== id);
        }
        return prev.map((i) => (i.id === id ? { ...i, qty: quantity } : i));
      });

      if (isAuthenticated) {
        if (quantity <= 0) {
          void fetch(CART_REMOVE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: id }),
          }).catch(() => {});
        } else {
          // On envoie la quantité cible en repassant par /add (incrément) n'est pas fiable,
          // donc on utilise /sync avec un seul élément.
          void fetch(CART_SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              items: [{ product_id: id, quantity }],
            }),
          }).catch(() => {});
        }
      }
    },
    [isAuthenticated]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedPromo(null);
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
