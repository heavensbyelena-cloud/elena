'use client';

import { useState } from 'react';
import { PLACEHOLDER } from '@/lib/product-images';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  badge?: string;
}

function GalleryImg({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const list = images.length > 0 ? images : [PLACEHOLDER];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--fond-carte)', overflow: 'hidden', border: '1px solid var(--bordure)' }}>
        {badge && <span className="product-badge">{badge}</span>}
        <GalleryImg src={current} alt={alt} priority />
      </div>

      {list.length > 1 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={active === i}
              style={{
                position: 'relative',
                width: 72,
                height: 72,
                flexShrink: 0,
                padding: 0,
                border: active === i ? '2px solid var(--accent)' : '1px solid var(--bordure)',
                background: 'var(--fond-carte)',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <GalleryImg src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
