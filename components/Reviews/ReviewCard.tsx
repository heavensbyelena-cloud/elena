import type { Review } from '@/types';

function stars(n: number) {
  const r = Math.round(Math.max(0, Math.min(5, n)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return ''; }
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      style={{ background: 'var(--blanc)', border: '1px solid var(--bordure)', padding: '28px 24px' }}
      itemScope itemType="https://schema.org/Review"
    >
      <meta itemProp="reviewRating" content={String(review.rating)} />
      <div style={{ fontSize: '0.9rem', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '12px' }}>
        {stars(review.rating)}
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--noir)', lineHeight: 1.7, marginBottom: '14px', fontStyle: 'italic' }} itemProp="reviewBody">
        &ldquo;{review.comment}&rdquo;
      </p>
      <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)' }} itemProp="author">
        {review.author_name || 'Client anonyme'}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--gris)', marginTop: '4px' }}>
        {fmtDate(review.created_at)}
      </div>
    </div>
  );
}
