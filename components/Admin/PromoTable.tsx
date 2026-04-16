'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PromoCode } from '@/types';

type Row = PromoCode & { id: string };

interface PromoTableProps {
  onEdit: (id: string) => void;
  refreshToken: number;
}

export default function PromoTable({ onEdit, refreshToken }: PromoTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/promo', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erreur de chargement');
        setRows([]);
        return;
      }
      const data = json.data;
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError('Erreur réseau');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  async function toggleActive(row: Row) {
    try {
      const res = await fetch(`/api/promo/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !row.active }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j.error === 'string' ? j.error : 'Erreur');
        return;
      }
      void load();
    } catch {
      alert('Erreur réseau');
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Supprimer le code « ${row.code} » ?`)) return;
    try {
      const res = await fetch(`/api/promo/${row.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j.error === 'string' ? j.error : 'Erreur');
        return;
      }
      void load();
    } catch {
      alert('Erreur réseau');
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--gris)]">Chargement…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="overflow-x-auto border border-[var(--bordure)]">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--bordure)] bg-[var(--fond-casse)]">
            {['Code', 'Valeur', 'Utilisations', 'Expiration', 'Personnel', 'Actif', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-[0.65rem] font-normal uppercase tracking-[0.12em] text-[var(--gris)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const expired = r.expires_at ? new Date(r.expires_at) < new Date() : false;
            const uses = `${r.uses_count}${r.max_uses != null ? ` / ${r.max_uses}` : ''}`;
            return (
              <tr key={r.id} className="border-b border-[var(--bordure)]">
                <td className="px-3 py-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{r.code}</td>
                <td className="px-3 py-3">{r.value}%</td>
                <td className="px-3 py-3 text-[var(--gris)]">{uses}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[var(--gris)]">
                      {r.expires_at
                        ? new Date(r.expires_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                    {expired && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-red-700">
                        Expiré
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {r.is_personal ? (
                    <span className="rounded border border-[var(--bordure)] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
                      Personnel
                    </span>
                  ) : (
                    <span className="text-[var(--gris)]">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleActive(r)}
                    className={`rounded px-2 py-1 text-[0.65rem] uppercase tracking-wide ${
                      r.active
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {r.active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(r.id)}
                      className="text-[0.7rem] uppercase tracking-wide underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(r)}
                      className="text-[0.7rem] uppercase tracking-wide text-red-600 underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-8 text-center text-[var(--gris)]">Aucun code promo.</p>
      )}
    </div>
  );
}
