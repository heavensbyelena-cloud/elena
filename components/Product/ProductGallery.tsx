'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PLACEHOLDER } from '@/lib/product-images';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  badge?: string;
}

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const list = images.length > 0 ? images : [PLACEHOLDER];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--fond-carte)', overflow: 'hidden', border: '1px solid var(--bordure)' }}>
        {badge && <span className="product-badge">{badge}</span>}
        <Image
          src={current}
          alt={alt}
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="(max-width:768px) 100vw, 50vw"
          unoptimized={current.includes('placehold.co') || current.startsWith('https://res.cloudinary.com')}
        />
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
              <Image
                src={src}
                alt=""
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
                unoptimized={src.includes('placehold.co') || src.startsWith('https://res.cloudinary.com')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
