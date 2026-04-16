'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);
  const [successMeta, setSuccessMeta] = useState<{
    message: string;
    needsEmailConfirmation: boolean;
    usedAutoConfirm: boolean;
    email: string;
  } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendHint, setResendHint] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!firstName || !email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        message?: string;
        needsEmailConfirmation?: boolean;
        usedAutoConfirm?: boolean;
      };
      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : 'Une erreur est survenue.';
        const extra =
          typeof data.details === 'string' ? ` (${data.details})` : '';
        throw new Error(msg + extra);
      }
      const msg =
        typeof data.message === 'string'
          ? data.message
          : 'Compte créé.';
      setSuccessMeta({
        message: msg,
        needsEmailConfirmation: data.needsEmailConfirmation === true,
        usedAutoConfirm: data.usedAutoConfirm === true,
        email,
      });
      setResendHint('');
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!successMeta?.email) return;
    setResendLoading(true);
    setResendHint('');
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: successMeta.email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setResendHint(
          typeof data.error === 'string' ? data.error : 'Échec du renvoi.'
        );
        return;
      }
      setResendHint(
        typeof data.message === 'string'
          ? data.message
          : 'Demande envoyée.'
      );
    } finally {
      setResendLoading(false);
    }
  }

  if (done && successMeta) {
    const showResend =
      successMeta.needsEmailConfirmation && !successMeta.usedAutoConfirm;

    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>✦</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 400, marginBottom: '16px' }}>Compte créé !</h1>
          <p style={{ color: 'var(--gris)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '20px' }}>
            {successMeta.message}
          </p>
          {showResend && (
            <div style={{ marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="btn-secondary"
                style={{ padding: '12px 20px', fontSize: '0.72rem', cursor: resendLoading ? 'wait' : 'pointer', opacity: resendLoading ? 0.7 : 1 }}
              >
                {resendLoading ? 'Envoi…' : 'Renvoyer l’email de confirmation'}
              </button>
              {resendHint && (
                <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--gris-fonce)' }}>{resendHint}</p>
              )}
            </div>
          )}
          <Link href="/account/login" className="btn-primary">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--fond-casse)' }}>
      <div
        className="surface-light"
        style={{ width: '100%', maxWidth: '440px', background: 'var(--blanc)', border: '1px solid var(--bordure)', padding: '48px 40px' }}
      >
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 400, letterSpacing: '0.15em', textAlign: 'center', marginBottom: '8px' }}>
          Créer un compte
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '36px' }}>
          Rejoignez Heaven&apos;s By Elena
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {[
            { id: 'firstName', label: 'Prénom', value: firstName, setter: setFirstName, type: 'text',  placeholder: 'Elena',            autoComplete: 'given-name' },
            { id: 'email',     label: 'Email',  value: email,     setter: setEmail,     type: 'email', placeholder: 'votre@email.fr',   autoComplete: 'email' },
            { id: 'password',  label: 'Mot de passe (6 caractères min.)', value: password, setter: setPassword, type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
            { id: 'confirm',   label: 'Confirmer le mot de passe', value: confirm, setter: setConfirm, type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
          ].map(f => (
            <div key={f.id} style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor={f.id}>{f.label}</label>
              <input id={f.id} type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} autoComplete={f.autoComplete} className="form-input" />
            </div>
          ))}

          {error && <p style={{ color: '#c05050', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem' }}>
          Déjà inscrit ?{' '}
          <Link href="/account/login" style={{ color: 'var(--noir)', textDecoration: 'underline', fontWeight: 500 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
