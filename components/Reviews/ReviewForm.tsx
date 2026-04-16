'use client';

import { useState } from 'react';

interface Props {
  productId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: Props) {
  const [rating, setRating]   = useState(0);
  const [hover,  setHover]    = useState(0);
  const [comment, setComment] = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!rating)                   return setMsg({ text: 'Veuillez sélectionner une note.', type: 'error' });
    if (comment.trim().length < 5) return setMsg({ text: "L'avis doit contenir au moins 5 caractères.", type: 'error' });

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim().slice(0, 1000), author_name: name.trim() || null, product_id: productId }),
      });
      if (!res.ok) throw new Error();
      setMsg({ text: 'Merci ! Votre avis sera visible après modération.', type: 'success' });
      setRating(0); setComment(''); setName('');
      onSuccess?.();
    } catch {
      setMsg({ text: 'Une erreur est survenue. Réessayez.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const ratingLabels = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent'];
  const activeRating = hover || rating;

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Laisser un avis
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--texte-muted)', letterSpacing: '0.05em' }}>
          Votre expérience aide les autres clients à choisir.
        </p>
      </div>

      <div style={{ border: '1px solid var(--bordure)', padding: '40px 48px', background: 'var(--fond-carte)' }}>
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Note étoiles ── */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '16px' }}>
              Votre note *
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '10px' }} role="radiogroup" aria-label="Note">
              {[1, 2, 3, 4, 5].map(n => (
                <span
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    fontSize: '2.2rem',
                    cursor: 'pointer',
                    color: n <= activeRating ? 'var(--accent)' : 'var(--bordure-hover)',
                    transition: 'color 0.15s, transform 0.15s',
                    transform: n <= activeRating ? 'scale(1.1)' : 'scale(1)',
                    userSelect: 'none',
                    display: 'inline-block',
                  }}
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: activeRating ? 'var(--accent)' : 'transparent', letterSpacing: '0.1em', minHeight: '1.2em', transition: 'color 0.2s' }}>
              {ratingLabels[activeRating]}
            </p>
          </div>

          {/* ── Séparateur ── */}
          <div style={{ borderTop: '1px solid var(--bordure)', marginBottom: '28px' }} />

          {/* ── Commentaire ── */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="rev-comment">
              Votre avis *
            </label>
            <textarea
              id="rev-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Décrivez votre expérience : qualité, rendu, livraison…"
              required
              rows={5}
              className="form-input"
              style={{ resize: 'vertical', lineHeight: '1.7' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--texte-muted)', marginTop: '6px', textAlign: 'right' }}>
              {comment.length} / 1000 caractères
            </p>
          </div>

          {/* ── Prénom ── */}
          <div style={{ marginBottom: '32px' }}>
            <label className="form-label" htmlFor="rev-name">
              Votre prénom <span style={{ opacity: 0.6, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
            </label>
            <input
              id="rev-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Sophie"
              maxLength={50}
              className="form-input"
            />
          </div>

          {/* ── Message retour ── */}
          {msg && (
            <div style={{
              padding: '14px 20px',
              marginBottom: '24px',
              border: `1px solid ${msg.type === 'success' ? 'rgba(90,138,90,0.5)' : 'rgba(192,80,80,0.5)'}`,
              background: msg.type === 'success' ? 'rgba(90,138,90,0.08)' : 'rgba(192,80,80,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{msg.type === 'success' ? '✓' : '!'}</span>
              <p style={{ fontSize: '0.85rem', color: msg.type === 'success' ? '#7ab87a' : '#d07070', lineHeight: 1.5 }}>
                {msg.text}
              </p>
            </div>
          )}

          {/* ── Bouton ── */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1, letterSpacing: '0.25em' }}
          >
            {loading ? 'Publication en cours…' : 'Publier mon avis'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.72rem', color: 'var(--texte-muted)', letterSpacing: '0.03em' }}>
            Votre avis sera visible après modération (sous 24h).
          </p>
        </form>
      </div>
    </div>
  );
}
