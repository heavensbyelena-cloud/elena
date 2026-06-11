'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  confirmation:
    'Le lien de confirmation est invalide ou expiré. Connectez-vous ou demandez un nouvel email depuis la page d’inscription.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const next = searchParams.get('redirect') ?? '/account/dashboard';
      const callback = new URL('/auth/confirm', window.location.origin);
      callback.searchParams.set('code', code);
      callback.searchParams.set('next', next);
      window.location.replace(callback.toString());
      return;
    }

    if (searchParams.get('confirmed') === '1') {
      setInfo('Votre adresse e-mail est confirmée. Vous pouvez vous connecter.');
      return;
    }

    const errKey = searchParams.get('error');
    if (errKey && ERROR_MESSAGES[errKey]) {
      setError(ERROR_MESSAGES[errKey]);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
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
      const redirectTo = searchParams.get('redirect');
      const target = redirectTo || '/account/dashboard';
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

          {info && <p style={{ color: '#3a7a6a', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{info}</p>}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--fond-casse)' }}>
        <p style={{ color: 'var(--gris)' }}>Chargement…</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
