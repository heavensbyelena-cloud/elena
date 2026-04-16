'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Connexion impossible');
      }
      const redirectTo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      const target = redirectTo || '/account/dashboard';
      // Délai pour laisser le navigateur enregistrer le cookie avant la redirection
      await new Promise(r => setTimeout(r, 300));
      window.location.href = target;
    } catch (err: unknown) {
      setError((err as Error).message === 'Invalid login credentials' || (err as Error).message?.includes('Identifiants')
        ? 'Email ou mot de passe incorrect.'
        : (err as Error).message || 'Une erreur est survenue.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--fond-casse)' }}>
      <div
        className="surface-light"
        style={{ width: '100%', maxWidth: '440px', background: 'var(--blanc)', border: '1px solid var(--bordure)', padding: '48px 40px' }}
      >
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 400, letterSpacing: '0.15em', textAlign: 'center', marginBottom: '8px' }}>
          Connexion
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '36px' }}>
          Accédez à votre espace client
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" autoComplete="email" required className="form-input" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required className="form-input" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '28px' }}>
            <span className="link-subtle" style={{ fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Mot de passe oublié ?
            </span>
          </div>

          {error && <p style={{ color: '#c05050', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem' }}>
          Pas encore de compte ?{' '}
          <Link href="/account/register" style={{ color: 'var(--noir)', textDecoration: 'underline', fontWeight: 500 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
