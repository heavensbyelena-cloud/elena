import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: '20px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: '6rem', color: 'var(--accent)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.15em' }}>
        Page introuvable
      </h1>
      <p style={{ color: 'var(--gris)', fontSize: '0.95rem', maxWidth: '380px', lineHeight: 1.7 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn-primary" style={{ marginTop: '10px' }}>Retour à l&apos;accueil</Link>
    </div>
  );
}
