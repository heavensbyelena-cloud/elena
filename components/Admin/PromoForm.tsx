'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AssignedUserRow {
  user_id: string;
  max_uses: number;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface PromoFormProps {
  promoId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type SearchUser = { id: string; email: string; first_name?: string | null; last_name?: string | null };

export default function PromoForm({ promoId, open, onClose, onSaved }: PromoFormProps) {
  const [code, setCode] = useState('');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isPersonal, setIsPersonal] = useState(false);
  const [assigned, setAssigned] = useState<AssignedUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [newUserMaxUses, setNewUserMaxUses] = useState(1);

  const reset = useCallback(() => {
    setCode('');
    setValue(10);
    setMinOrder('');
    setMaxUses('');
    setExpiresAt('');
    setIsPersonal(false);
    setMaxUsesPerUser('1');
    setAssigned([]);
    setSearch('');
    setSearchResults([]);
    setError('');
    setNewUserMaxUses(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
    if (!promoId) return;

    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/promo/${promoId}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === 'string' ? json.error : 'Erreur de chargement');
          return;
        }
        const d = json.data as {
          code: string;
          value: number;
          min_order: number | null;
          max_uses: number | null;
          expires_at: string | null;
          is_personal: boolean;
          assigned_users?: Array<{
            user_id: string;
            max_uses: number;
            profile?: { email?: string; first_name?: string | null; last_name?: string | null };
          }>;
        };
        if (cancelled) return;
        setCode(d.code ?? '');
        setValue(Number(d.value) || 10);
        setMinOrder(d.min_order != null ? String(d.min_order) : '');
        setMaxUses(d.max_uses != null ? String(d.max_uses) : '');
        setMaxUsesPerUser(
          (d as unknown as { max_uses_per_user?: number | null }).max_uses_per_user != null
            ? String((d as unknown as { max_uses_per_user?: number | null }).max_uses_per_user)
            : '1'
        );
        if (d.expires_at) {
          const dt = new Date(d.expires_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          setExpiresAt(
            `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
          );
        } else setExpiresAt('');
        setIsPersonal(Boolean(d.is_personal));
        const au = d.assigned_users ?? [];
        setAssigned(
          au.map((a) => ({
            user_id: a.user_id,
            max_uses: a.max_uses ?? 1,
            email: a.profile?.email,
            first_name: a.profile?.first_name,
            last_name: a.profile?.last_name,
          }))
        );
      } catch {
        setError('Erreur réseau');
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, promoId, reset]);

  useEffect(() => {
    if (!open || !isPersonal || search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/promo?search=${encodeURIComponent(search.trim())}`,
            { credentials: 'include' }
          );
          const json = await res.json().catch(() => ({}));
          if (!res.ok) return;
          const users = (json.data?.users ?? []) as SearchUser[];
          setSearchResults(users);
        } catch {
          setSearchResults([]);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [open, isPersonal, search]);

  function addUser(u: SearchUser) {
    if (assigned.some((a) => a.user_id === u.id)) return;
    setAssigned((prev) => [
      ...prev,
      {
        user_id: u.id,
        max_uses: Math.max(1, newUserMaxUses),
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
      },
    ]);
    setSearch('');
    setSearchResults([]);
  }

  function removeAssigned(uid: string) {
    setAssigned((prev) => prev.filter((a) => a.user_id !== uid));
  }

  function updateAssignedMax(uid: string, max: number) {
    setAssigned((prev) =>
      prev.map((a) => (a.user_id === uid ? { ...a, max_uses: Math.max(1, max) } : a))
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const codeTrim = code.trim().toUpperCase();
    if (!codeTrim) {
      setError('Le code est obligatoire.');
      return;
    }
    if (value < 1 || value > 100) {
      setError('La valeur doit être entre 1 et 100 %.');
      return;
    }
    if (isPersonal && assigned.length === 0) {
      setError('Ajoutez au moins un client pour un code personnel.');
      return;
    }

    const body: Record<string, unknown> = {
      code: codeTrim,
      value,
      min_order: minOrder === '' ? null : Number(minOrder),
      max_uses: isPersonal ? null : maxUses === '' ? null : Number(maxUses),
      max_uses_per_user: isPersonal ? null : maxUsesPerUser === '' ? null : Number(maxUsesPerUser),
      is_personal: isPersonal,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      assigned_users: isPersonal
        ? assigned.map((a) => ({ user_id: a.user_id, max_uses: a.max_uses }))
        : [],
    };

    setLoading(true);
    try {
      const url = promoId ? `/api/promo/${promoId}` : '/api/promo';
      const method = promoId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erreur d’enregistrement');
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--bordure)] bg-[var(--fond-carte)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {promoId ? 'Modifier le code' : 'Nouveau code promo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm uppercase tracking-wider text-[var(--gris)]"
          >
            Fermer
          </button>
        </div>

        {loadingDetail ? (
          <p className="text-sm text-[var(--gris)]">Chargement…</p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <label className="form-label">Code *</label>
              <input
                className="form-input w-full uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Réduction (%) *</label>
              <input
                type="number"
                min={1}
                max={100}
                className="form-input w-full"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="form-label">Montant minimum de commande (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-input w-full"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            {!isPersonal && (
              <>
                <div>
                  <label className="form-label">Nombre d&apos;utilisations max (global)</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input w-full"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Illimité si vide"
                  />
                  <p className="mt-1 text-[0.72rem] text-[var(--gris)]">
                    Total d&apos;utilisations tous clients confondus.
                  </p>
                </div>
                <div>
                  <label className="form-label">Utilisations max par client</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input w-full"
                    value={maxUsesPerUser}
                    onChange={(e) => setMaxUsesPerUser(e.target.value)}
                    placeholder="1"
                  />
                  <p className="mt-1 text-[0.72rem] text-[var(--gris)]">
                    Nombre de fois qu&apos;un même client peut utiliser ce code. Par défaut : 1.
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="form-label">Date d&apos;expiration</label>
              <input
                type="datetime-local"
                className="form-input w-full"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="promo-personal"
                type="checkbox"
                checked={isPersonal}
                onChange={(e) => setIsPersonal(e.target.checked)}
              />
              <label htmlFor="promo-personal" className="text-sm">
                Code personnel (réservé à des clients)
              </label>
            </div>

            {isPersonal && (
              <div className="space-y-2 border border-[var(--bordure)] p-3">
                <p className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--gris)]">
                  Clients autorisés
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="form-input min-w-0 flex-1"
                    placeholder="Rechercher par email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    className="form-input w-20"
                    title="max utilisations par défaut pour le prochain ajout"
                    value={newUserMaxUses}
                    onChange={(e) => setNewUserMaxUses(Number(e.target.value) || 1)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <ul className="max-h-32 overflow-auto border border-[var(--bordure)] bg-white text-sm">
                    {searchResults.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="w-full px-2 py-1.5 text-left hover:bg-[var(--fond-casse)]"
                          onClick={() => addUser(u)}
                        >
                          {u.email}
                          {u.first_name || u.last_name
                            ? ` — ${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                            : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="space-y-2">
                  {assigned.map((a) => (
                    <li
                      key={a.user_id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bordure)] py-2 text-sm"
                    >
                      <span className="min-w-0">{a.email ?? a.user_id.slice(0, 8)}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--gris)]">Max</label>
                        <input
                          type="number"
                          min={1}
                          className="form-input w-16 py-1 text-sm"
                          value={a.max_uses}
                          onChange={(e) =>
                            updateAssignedMax(a.user_id, Number(e.target.value) || 1)
                          }
                        />
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => removeAssigned(a.user_id)}
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              {loading ? 'Enregistrement…' : promoId ? 'Enregistrer' : 'Créer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
