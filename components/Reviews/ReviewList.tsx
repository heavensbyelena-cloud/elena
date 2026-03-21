import ReviewCard from './ReviewCard';
import type { Review } from '@/types';

function stars(n: number) {
  const r = Math.round(Math.max(0, Math.min(5, n)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

interface Props {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

export default function ReviewList({ reviews, averageRating, totalCount }: Props) {
  return (
    <div itemScope itemType="https://schema.org/AggregateRating">
      <meta itemProp="ratingValue" content={averageRating.toFixed(1)} />
      <meta itemProp="reviewCount" content={String(totalCount)} />

      {/* Résumé */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 400, lineHeight: 1, marginBottom: '8px' }}>
          {totalCount > 0 ? averageRating.toFixed(1) : '—'}
        </div>
        <div style={{ fontSize: '1.4rem', color: 'var(--accent)', letterSpacing: '4px', marginBottom: '8px' }}>
          {totalCount > 0 ? stars(averageRating) : '☆☆☆☆☆'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--gris)', letterSpacing: '0.1em' }}>
          {totalCount > 0 ? `${totalCount} avis vérifié${totalCount > 1 ? 's' : ''}` : 'Aucun avis pour le moment'}
        </div>
      </div>

      {/* Grille avis */}
      {reviews.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>
          Soyez le premier à partager votre expérience !
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '28px', maxWidth: '1100px', margin: '0 auto' }} className="reviews-grid-resp">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
          <style>{`
            @media(max-width:968px){ .reviews-grid-resp{ grid-template-columns:repeat(2,1fr) !important; } }
            @media(max-width:600px){ .reviews-grid-resp{ grid-template-columns:1fr !important; } }
          `}</style>
        </>
      )}
    </div>
  );
}
