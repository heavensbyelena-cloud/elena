'use client';

import { useState } from 'react';

interface Props {
  /** Slug de la sous-catégorie à supprimer (ex: 'decoration-plateaux') */
  slug: string;
  /** Label affiché (ex: 'Plateaux & Dessous de verre') */
  label: string;
  /** Nombre de produits dans cette sous-catégorie */
  productCount: number;
  /** Autres sous-catégories decoration disponibles pour la réassignation */
  otherSubcats: { slug: string; label: string }[];
  /** Appelé après succès pour rafraîchir la page */
  onSuccess: () => void;
  /** Ferme le modal sans action */
  onClose: () => void;
}

export default function DeleteResineSubcatModal({
  slug, label, productCount, otherSubcats, onSuccess, onClose,
}: Props) {
  const [mode, setMode] = useState<'choose' | 'reassign' | 'delete'>('choose');
  const [reassignTarget, setReassignTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReassign() {
    if (!reassignTarget) {
      setError('Veuillez choisir une sous-catégorie de destination.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reassign', from: slug, to: reassignTarget }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur serveur');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', category: slug }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur serveur');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--fond-carte)',
          border: '1px solid var(--bordure)',
          maxWidth: '500px', width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* En-tête */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--bordure)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.3rem', fontWeight: 400,
              letterSpacing: '0.1em', marginBottom: '6px',
            }}>
              Supprimer la sous-catégorie
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)' }}>
              <strong style={{ color: 'var(--texte)' }}>{label}</strong>
              {' '}·{' '}
              <span style={{ color: productCount > 0 ? '#c05050' : 'var(--gris)' }}>
                {productCount} produit{productCount > 1 ? 's' : ''}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--bordure)', background: 'transparent',
              cursor: 'pointer', fontSize: '0.65rem', textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'var(--texte-muted)', padding: '6px 10px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div style={{ padding: '28px' }}>

          {/* Étape 1 : choisir l'action */}
          {mode === 'choose' && (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)', marginBottom: '24px', lineHeight: 1.7 }}>
                {productCount > 0
                  ? `Cette sous-catégorie contient ${productCount} produit${productCount > 1 ? 's' : ''}. Que souhaitez-vous faire ?`
                  : 'Cette sous-catégorie est vide. Vous pouvez la supprimer sans risque.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {productCount > 0 && (
                  <button
                    onClick={() => setMode('reassign')}
                    style={{
                      padding: '14px 20px', textAlign: 'left',
                      border: '1px solid var(--bordure)', background: 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bordure)')}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--texte)', marginBottom: '4px' }}>
                      Réassigner les produits →
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gris)' }}>
                      Déplacer les {productCount} produit{productCount > 1 ? 's' : ''} vers une autre sous-catégorie décoration
                    </div>
                  </button>
                )}

                <button
                  onClick={() => productCount === 0 ? handleDelete() : setMode('delete')}
                  style={{
                    padding: '14px 20px', textAlign: 'left',
                    border: '1px solid #c05050', background: 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#c05050', marginBottom: '4px' }}>
                    {productCount > 0 ? 'Supprimer les produits et la sous-catégorie' : 'Supprimer la sous-catégorie'}
                  </div>
                  {productCount > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gris)' }}>
                      Supprime définitivement les {productCount} produit{productCount > 1 ? 's' : ''} — action irréversible
                    </div>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Étape 2a : réassigner */}
          {mode === 'reassign' && (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)', marginBottom: '20px' }}>
                Vers quelle sous-catégorie déplacer les <strong>{productCount} produit{productCount > 1 ? 's' : ''}</strong> ?
              </p>
              <select
                value={reassignTarget}
                onChange={e => setReassignTarget(e.target.value)}
                className="form-input"
                style={{ appearance: 'none', marginBottom: '20px' }}
              >
                <option value="">— Choisir la destination —</option>
                {otherSubcats.map(s => (
                  <option key={s.slug} value={s.slug}>{s.label}</option>
                ))}
              </select>
              {error && <p style={{ color: '#c05050', fontSize: '0.82rem', marginBottom: '12px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleReassign}
                  disabled={loading}
                  className="btn-primary"
                  style={{ padding: '12px 24px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Déplacement…' : 'Confirmer le déplacement'}
                </button>
                <button
                  onClick={() => setMode('choose')}
                  style={{ padding: '12px 20px', border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--gris)' }}
                >
                  Retour
                </button>
              </div>
            </>
          )}

          {/* Étape 2b : confirmation suppression */}
          {mode === 'delete' && (
            <>
              <div style={{
                background: 'rgba(192,80,80,0.06)', border: '1px solid rgba(192,80,80,0.3)',
                padding: '16px', marginBottom: '24px',
              }}>
                <p style={{ fontSize: '0.85rem', color: '#c05050', fontWeight: 500, marginBottom: '6px' }}>
                  ⚠ Action irréversible
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--texte-muted)', lineHeight: 1.6 }}>
                  Les <strong>{productCount} produit{productCount > 1 ? 's' : ''}</strong> de la sous-catégorie{' '}
                  <strong>"{label}"</strong> seront supprimés définitivement.
                </p>
              </div>
              {error && <p style={{ color: '#c05050', fontSize: '0.82rem', marginBottom: '12px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    padding: '12px 24px', border: 'none',
                    background: '#c05050', color: '#fff',
                    fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Suppression…' : 'Oui, tout supprimer'}
                </button>
                <button
                  onClick={() => setMode('choose')}
                  style={{ padding: '12px 20px', border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--gris)' }}
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
