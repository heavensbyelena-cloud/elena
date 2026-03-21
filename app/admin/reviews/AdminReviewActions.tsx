'use client';

import { useRouter } from 'next/navigation';

export default function AdminReviewActions({ reviewId, currentStatus }: { reviewId: string; currentStatus: string }) {
  const router = useRouter();

  async function update(status: string) {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      console.error('[AdminReviewActions] Erreur:', data);
      alert('Erreur lors de la mise à jour : ' + (data.error ?? res.status));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
      {currentStatus !== 'approved' && (
        <button onClick={() => update('approved')} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #5a8a5a', color: '#5a8a5a', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          ✓ Approuver
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button onClick={() => update('rejected')} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #c05050', color: '#c05050', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          ✕ Refuser
        </button>
      )}
    </div>
  );
}
