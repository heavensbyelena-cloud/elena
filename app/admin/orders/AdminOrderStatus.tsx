'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { translateStatus } from '@/lib/utils';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderStatus({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function patchStatus(newStatus: string, notes?: string) {
    setSaving(true);
    try {
      const body: { status: string; notes?: string } = { status: newStatus };
      if (notes !== undefined) body.notes = notes;
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(typeof data.error === 'string' ? data.error : 'Mise à jour impossible.');
        setStatus(currentStatus);
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === 'shipped' && status !== 'shipped') {
      setTrackingInput('');
      setShipModalOpen(true);
      return;
    }
    void patchStatus(newStatus);
  }

  function cancelShipModal() {
    setShipModalOpen(false);
    setTrackingInput('');
  }

  function confirmShip() {
    setShipModalOpen(false);
    void patchStatus('shipped', trackingInput.trim());
    setTrackingInput('');
  }

  return (
    <>
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        style={{
          fontSize: '0.72rem',
          padding: '4px 8px',
          border: '1px solid var(--bordure)',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {translateStatus(s)}
          </option>
        ))}
      </select>

      {shipModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ship-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6,6,6,0.72)',
            padding: '16px',
          }}
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) cancelShipModal();
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              border: '1px solid var(--bordure)',
              background: 'var(--blanc)',
              padding: '22px 20px',
              fontFamily: 'Inter, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ship-modal-title" style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px 0' }}>
              Expédition
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--gris-fonce)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Indiquez le numéro de suivi ou le lien du transporteur. Vous pouvez laisser ce champ vide et passer quand
              même en « Expédiée » si vous n’avez pas encore le suivi.
            </p>
            <label htmlFor="tracking-notes" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)' }}>
              Numéro de suivi (optionnel)
            </label>
            <textarea
              id="tracking-notes"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              rows={3}
              placeholder="Ex. 1Z999AA10123456784"
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 12px',
                fontSize: '0.75rem',
                border: '1px solid var(--bordure)',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={cancelShipModal}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--bordure)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmShip}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: 'var(--noir)',
                  color: 'var(--blanc)',
                  cursor: 'pointer',
                }}
              >
                Confirmer l’expédition
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
