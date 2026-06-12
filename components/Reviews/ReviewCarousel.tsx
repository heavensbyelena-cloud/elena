'use client';

import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import ReviewCard from '@/components/Reviews/ReviewCard';
import type { PublicReview } from '@/lib/reviews';

function stars(n: number) {
  const r = Math.round(Math.max(0, Math.min(5, n)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

interface ReviewCarouselProps {
  reviews: PublicReview[];
  averageRating: number;
}

const trackStyle: CSSProperties = {
  display: 'flex',
  gap: '24px',
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth',
  padding: '4px 2px 12px',
  WebkitOverflowScrolling: 'touch',
};

const slideStyle: CSSProperties = {
  flex: '0 0 min(100%, 340px)',
  scrollSnapAlign: 'start',
  display: 'flex',
  flexDirection: 'column',
};

export default function ReviewCarousel({ reviews, averageRating }: ReviewCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, reviews.length]);

  function scroll(dir: 'left' | 'right') {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-review-slide]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  }

  if (reviews.length === 0) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2.5rem',
            fontWeight: 400,
            lineHeight: 1,
            marginBottom: '8px',
            color: 'var(--texte)',
          }}
        >
          {averageRating.toFixed(1)}
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent)', letterSpacing: '4px', marginBottom: '8px' }}>
          {stars(averageRating)}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--gris)', letterSpacing: '0.1em' }}>
          {reviews.length} avis client{reviews.length > 1 ? 's' : ''} récent{reviews.length > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ position: 'relative', padding: '0 8px' }}>
        {canPrev && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Avis précédents"
            style={{ ...arrowBase, left: 0 }}
          >
            ‹
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Avis suivants"
            style={{ ...arrowBase, right: 0 }}
          >
            ›
          </button>
        )}

        <div ref={trackRef} className="review-carousel-track" style={trackStyle}>
          {reviews.map((review) => (
            <div key={review.id} data-review-slide style={slideStyle}>
              <ReviewCard review={review} />
              {review.product_id && review.product_name && (
                <Link
                  href={`/product/${review.product_id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                  }}
                >
                  Voir : {review.product_name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .review-carousel-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .review-carousel-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

const arrowBase: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '1px solid var(--bordure)',
  background: 'var(--fond-carte)',
  color: 'var(--texte)',
  fontSize: '1.4rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
};
