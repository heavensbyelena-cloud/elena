'use client';

import { useState, useEffect } from 'react';

interface ProfileData {
  first_name?: string | null;
  last_name?: string | null;
  default_address?: Record<string, unknown> | null;
}
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function ProfilePage() {
  const router = useRouter();

  // Infos de base
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Adresse par défaut
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');

  // Changement de mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingProfile(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/account/login');
        return;
      }
      setEmail(user.email ?? '');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, default_address')
        .eq('id', user.id)
        .single();

      const profile = profileData as ProfileData | null;
      if (profile?.first_name) setFirstName(profile.first_name);
      if (profile?.last_name) setLastName(profile.last_name);

      const addr = (profile?.default_address || {}) as {
        first_name?: string;
        last_name?: string;
        address?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        phone?: string;
      };
      if (addr.address) setAddress(addr.address);
      if (addr.city) setCity(addr.city);
      if (addr.postal_code) setPostalCode(addr.postal_code);
      if (addr.country) setCountry(addr.country);
      if (addr.phone) setPhone(addr.phone);

      setLoadingProfile(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any).update({
        first_name: firstName,
        last_name: lastName,
        default_address: {
          first_name: firstName,
          last_name: lastName,
          address,
          city,
          postal_code: postalCode,
          country,
          phone,
        },
      }).eq('id', user.id);

      setMsg({ text: 'Profil et adresse mis à jour.', type: 'success' });
    } catch {
      setMsg({ text: 'Une erreur est survenue.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPassword || newPassword.length < 8) {
      setPwdMsg({ text: 'Le nouveau mot de passe doit faire au moins 8 caractères.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwdMsg({ text: 'Mot de passe mis à jour.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwdMsg({ text: 'Impossible de changer le mot de passe.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.15em', marginBottom: '40px' }}>
        Mon profil
      </h1>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', borderBottom: '1px solid var(--bordure)', paddingBottom: '20px' }}>
        {[
          { label: 'Mes commandes', href: '/account/dashboard' },
          { label: 'Mon profil',    href: '/account/profile', active: true },
        ].map(l => (
          <Link key={l.label} href={l.href} style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: l.active ? 'var(--noir)' : 'var(--gris)', textDecoration: 'none', borderBottom: l.active ? '1px solid var(--noir)' : '1px solid transparent', paddingBottom: '4px' }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Profil + adresse */}
      <form onSubmit={handleSave}>
        <fieldset disabled={loadingProfile} style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" htmlFor="firstName">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
            />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" htmlFor="lastName">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="form-input"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--gris)', marginTop: '6px' }}>
              L&apos;email ne peut pas être modifié directement.
            </p>
          </div>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.3rem',
              fontWeight: 400,
              margin: '24px 0 12px',
              letterSpacing: '0.1em',
            }}
          >
            Adresse de livraison par défaut
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="address">
              Adresse
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input"
              placeholder="43 rue de la Paix"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" htmlFor="city">
                Ville
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="postal">
                Code postal
              </label>
              <input
                id="postal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="country">
              Pays
            </label>
            <input
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="form-input"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="phone">
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              placeholder="+33 6 ..."
            />
          </div>

          {msg && (
            <p
              style={{
                color: msg.type === 'success' ? '#5a8a5a' : '#c05050',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile || loadingProfile}
            className="btn-primary"
            style={{ padding: '14px 32px', opacity: savingProfile || loadingProfile ? 0.7 : 1 }}
          >
            {savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
          </button>
        </fieldset>
      </form>

      {/* Changement de mot de passe */}
      <div style={{ marginTop: '40px', borderTop: '1px solid var(--bordure)', paddingTop: '28px' }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.3rem',
            fontWeight: 400,
            marginBottom: '16px',
            letterSpacing: '0.1em',
          }}
        >
          Changer mon mot de passe
        </h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="newPassword">
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
          </div>
          {pwdMsg && (
            <p
              style={{
                color: pwdMsg.type === 'success' ? '#5a8a5a' : '#c05050',
                fontSize: '0.85rem',
                marginBottom: '12px',
              }}
            >
              {pwdMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={changingPassword}
            className="btn-secondary"
            style={{ padding: '10px 24px', fontSize: '0.8rem' }}
          >
            {changingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '40px', borderTop: '1px solid var(--bordure)', paddingTop: '24px' }}>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--gris)', cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'underline' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
