'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminProductActions({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Link
        href={`/admin/products/${productId}`}
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--blanc)',
          background: 'var(--noir)',
          border: '1px solid var(--noir)',
          padding: '6px 14px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Modifier
      </Link>
      <button
        onClick={handleDelete}
        style={{
          background: 'none',
          border: '1px solid #c05050',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#c05050',
          cursor: 'pointer',
          padding: '6px 14px',
          whiteSpace: 'nowrap',
        }}
      >
        Supprimer
      </button>
    </div>
  );
}
