'use client';

import { useState } from 'react';
import Modal from '@/components/Common/Modal';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Connexion impossible');
      }

      window.location.href = '/admin';
    } catch (err: unknown) {
      setError(
        (err as Error).message?.includes('admin') || (err as Error).message?.includes('réservé')
          ? (err as Error).message
          : (err as Error).message === 'Invalid login credentials' || (err as Error).message?.includes('Identifiants')
            ? 'Email ou mot de passe incorrect.'
            : (err as Error).message || 'Une erreur est survenue.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connexion Admin">
      <div
        style={{
          padding: '24px',
          minWidth: '320px',
          maxWidth: '400px',
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.4rem',
            fontWeight: 400,
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Connexion Admin
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--gris)', marginBottom: '24px' }}>
          Accès réservé aux administrateurs
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@heavensbyelena.com"
              autoComplete="email"
              required
              className="form-input"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="admin-password">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="form-input"
            />
          </div>

          {error && (
            <p style={{ color: '#c05050', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
