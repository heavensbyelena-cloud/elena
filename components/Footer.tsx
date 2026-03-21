'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  const [email, setEmail] = useState('');

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmail('');
    alert('Merci pour votre inscription !');
  }

  return (
    <footer style={{ background: 'var(--fond)', color: 'var(--texte)', padding: '60px 40px 30px', borderTop: '1px solid var(--bordure)' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '60px',
        marginBottom: '50px',
      }} className="footer-grid">

        {/* Marque */}
        <div>
          <Link href="/home" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2.2rem', color: 'var(--texte)', display: 'block', lineHeight: 1.2 }}>
              Heaven&apos;s
            </span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.75rem', fontVariant: 'small-caps', letterSpacing: '0.4em', color: 'var(--texte-muted)', display: 'block' }}>
              By Elena
            </span>
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)', maxWidth: '300px', marginTop: '20px', lineHeight: 1.7 }}>
            Bijoux faits main avec âme. Gold filled & Argent sterling.
          </p>

          {/* Newsletter */}
          <form onSubmit={handleNewsletter} style={{ marginTop: '24px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre email"
              style={{
                padding: '12px 16px',
                border: '1px solid var(--bordure)',
                background: 'var(--fond-carte)',
                color: 'var(--texte)',
                width: '100%',
                maxWidth: '250px',
                fontSize: '0.85rem',
                marginBottom: '10px',
                fontFamily: 'Inter, sans-serif',
                display: 'block',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: 'var(--accent)',
                border: 'none',
                color: 'var(--blanc)',
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              S&apos;abonner
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
              Instagram ↗
            </a>
          </div>
        </div>

        {/* Liens boutique */}
        <div>
          <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--texte)', borderBottom: '1px solid var(--accent)', paddingBottom: '8px', display: 'inline-block' }}>
            Boutique
          </h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {CATEGORIES.map(cat => (
              <li key={cat.slug} style={{ marginBottom: '10px' }}>
                <Link href={`/shop?category=${cat.slug}`} style={{ color: 'var(--texte-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.3s' }}>
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Liens infos */}
        <div>
          <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--texte)', borderBottom: '1px solid var(--accent)', paddingBottom: '8px', display: 'inline-block' }}>
            Informations
          </h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { label: 'CGV', href: '/legal/terms' },
              { label: 'Confidentialité', href: '/legal/privacy' },
              { label: 'Mentions légales', href: '/legal/mentions' },
              { label: 'Contact', href: 'mailto:contact@heavensbyelena.fr' },
            ].map(link => (
              <li key={link.label} style={{ marginBottom: '10px' }}>
                <Link href={link.href} style={{ color: 'var(--texte-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bordure)', paddingTop: '30px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--texte-muted)' }}>
        © {new Date().getFullYear()} Heaven&apos;s By Elena. Tous droits réservés.
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; text-align: center; }
        }
      `}</style>
    </footer>
  );
}
