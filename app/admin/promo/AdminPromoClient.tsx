'use client';

import { useState } from 'react';
import Link from 'next/link';
import PromoTable from '@/components/Admin/PromoTable';
import PromoForm from '@/components/Admin/PromoForm';

export default function AdminPromoClient() {
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  function openNew() {
    setEditId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setEditId(id);
    setFormOpen(true);
  }

  function onSaved() {
    setRefreshToken((t) => t + 1);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title !mb-0">Codes promo</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={openNew} className="btn-primary text-xs uppercase tracking-wider">
            Nouveau code
          </button>
          <Link href="/admin" className="text-xs uppercase tracking-wider text-[var(--gris)] underline">
            ← Administration
          </Link>
        </div>
      </div>

      <nav className="mb-10 flex flex-wrap gap-2">
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Produits', href: '/admin/products' },
          { label: 'Commandes', href: '/admin/orders' },
          { label: 'Avis', href: '/admin/reviews' },
          { label: 'Codes promo', href: '/admin/promo', active: true },
        ].map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className={`border px-4 py-2 text-[0.72rem] uppercase tracking-[0.12em] no-underline ${
              l.active
                ? 'border-[var(--noir)] bg-[var(--noir)] text-[var(--blanc)]'
                : 'border-[var(--bordure)] text-[var(--gris)]'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <PromoTable onEdit={openEdit} refreshToken={refreshToken} />

      <PromoForm
        promoId={editId}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
