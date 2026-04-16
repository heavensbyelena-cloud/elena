'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { AppliedPromo } from '@/types';

export default function PromoInput() {
  const { total, appliedPromo, setAppliedPromo } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function apply() {
    setError('');
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Saisissez un code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed, cart_total: total }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : res.status === 401
              ? 'Connectez-vous pour utiliser un code promo.'
              : 'Code invalide.';
        setError(msg);
        return;
      }
      const payload = json.data as AppliedPromo | undefined;
      if (payload?.id && payload.code) {
        setAppliedPromo(payload);
        setCode('');
      } else {
        setError('Réponse invalide.');
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  function remove() {
    setError('');
    setAppliedPromo(null);
  }

  if (appliedPromo) {
    return (
      <div className="border border-[var(--bordure)] bg-white/40 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-medium tracking-wide text-[var(--texte)]">
              {appliedPromo.code}
            </span>
            <span className="ml-2 text-[var(--gris)]">
              −
              {appliedPromo.discount_amount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €
            </span>
          </div>
          <button
            type="button"
            onClick={remove}
            className="text-xs uppercase tracking-wider text-[var(--gris)] underline decoration-[var(--bordure)] hover:text-[var(--noir)]"
          >
            Retirer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--gris)]">Code promo</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void apply())}
          placeholder="Ex. ELENA20"
          disabled={loading}
          className="form-input flex-1 border border-[var(--bordure)] bg-white py-2 text-sm uppercase"
        />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={loading}
          className="btn-primary whitespace-nowrap px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-60"
        >
          {loading ? '…' : 'Appliquer'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
