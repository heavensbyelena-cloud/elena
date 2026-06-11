/** null / undefined = stock illimité */
export function maxCartQuantity(stock: number | null | undefined): number | null {
  if (stock == null || !Number.isFinite(stock)) return null;
  return Math.max(0, Math.floor(stock));
}

export function clampToStock(qty: number, stock: number | null | undefined): number {
  const max = maxCartQuantity(stock);
  const safe = Math.max(0, Math.floor(qty));
  if (max === null) return safe;
  return Math.min(safe, max);
}

export function isAtStockMax(qty: number, stock: number | null | undefined): boolean {
  const max = maxCartQuantity(stock);
  if (max === null) return false;
  return qty >= max;
}

export function hasAvailableStock(stock: number | null | undefined): boolean {
  const max = maxCartQuantity(stock);
  if (max === null) return true;
  return max > 0;
}

export type CartStockResult = 'added' | 'stock_limit' | 'out_of_stock';
