'use client';

import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import type { Product } from '@/types';
import { hasAvailableStock } from '@/lib/cart-stock';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const { showToast } = useToast();
  const outOfStock = !hasAvailableStock(product.stock);

  function handle() {
    if (outOfStock) {
      showToast('Ce produit est en rupture de stock.');
      return;
    }
    const result = addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image_url: product.image_url || '',
      stock: product.stock ?? null,
    });
    if (result === 'out_of_stock') showToast('Ce produit est en rupture de stock.');
    else if (result === 'stock_limit') showToast('Stock maximum atteint pour ce produit.');
    else {
      showToast(`${product.name} ajouté au panier ✦`);
      openCart();
    }
  }

  return (
    <button
      onClick={handle}
      disabled={outOfStock}
      className="btn-primary"
      style={{ padding: '16px 40px', fontSize: '0.8rem', opacity: outOfStock ? 0.5 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
    >
      {outOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
    </button>
  );
}
