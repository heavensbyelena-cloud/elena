'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export interface HeroCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface HeroSectionProps {
  /** H1 principal — doit contenir les mots-clés SEO */
  heading: string;
  /** H2 sous-titre */
  subheading?: string;
  /** Paragraphe de description (60-80 mots idéalement) */
  description: string;
  /** Boutons d'action */
  ctas?: HeroCta[];
  /** URL de l'image hero */
  imageSrc: string;
  /** Texte alternatif de l'image */
  imageAlt: string;
}

export default function HeroSection({
  heading,
  subheading,
  description,
  ctas = [],
  imageSrc,
  imageAlt,
}: HeroSectionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Présentation Heaven's By Elena"
      className="hero-section"
    >
        {/* ── Texte ── */}
        <div
          className="hero-text"
          style={{
            padding: '80px 60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* Badge marque */}
          <p
            aria-hidden="true"
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '24px',
            }}
          >
            Heaven&apos;s By Elena ✦ Créations artisanales
          </p>

          {/* H1 — mots-clés SEO */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 400,
              lineHeight: 1.3,
              marginBottom: '16px',
              color: 'var(--texte)',
              letterSpacing: '0.04em',
            }}
          >
            {heading}
          </h1>

          {/* H2 — sous-titre */}
          {subheading && (
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)',
                fontWeight: 300,
                color: 'var(--texte-muted)',
                marginBottom: '28px',
                letterSpacing: '0.12em',
                fontStyle: 'italic',
              }}
            >
              {subheading}
            </h2>
          )}

          {/* Description */}
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--texte-muted)',
              lineHeight: 1.85,
              maxWidth: '420px',
              marginBottom: '40px',
            }}
          >
            {description}
          </p>

          {/* CTAs */}
          {ctas.length > 0 && (
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {ctas.map((cta) => (
                <Link
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={
                    cta.variant === 'secondary'
                      ? 'btn-secondary'
                      : cta.variant === 'ghost'
                        ? 'btn-ghost'
                        : 'btn-primary'
                  }
                  style={{ padding: '13px 28px' }}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Image ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '500px',
            borderLeft: '1px solid var(--bordure)',
            overflow: 'hidden',
          }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 968px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            unoptimized={imageSrc.includes('placehold.co')}
          />
        </div>
    </section>
  );
}
