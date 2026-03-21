'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase-client';

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

export default function CheckoutPage() {
  const { items, total } = useCart();
  const shipping = total >= 60 ? 0 : 4.9;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal: '',
    country: 'France',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Pré-remplir avec le profil connecté (email + adresse par défaut)
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, default_address')
          .eq('id', user.id)
          .single();
        const profile = profileData as { first_name?: string | null; last_name?: string | null; default_address?: Record<string, unknown> | null } | null;

        const addr = (profile?.default_address || {}) as {
          first_name?: string;
          last_name?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          phone?: string;
        };

        setForm((prev) => ({
          firstName: profile?.first_name ?? addr.first_name ?? prev.firstName,
          lastName: profile?.last_name ?? addr.last_name ?? prev.lastName,
          email: user.email ?? prev.email,
          phone: addr.phone ?? prev.phone,
          address: addr.address ?? prev.address,
          city: addr.city ?? prev.city,
          postal: addr.postal_code ?? prev.postal,
          country: addr.country ?? prev.country,
        }));
      } catch {
        // on ignore en cas d'erreur, formulaire vierge
      }
    })();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city || !form.postal) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image_url: i.image_url,
        })),
        shipping_address: {
          first_name: form.firstName,
          last_name: form.lastName,
          address: form.address,
          city: form.city,
          postal_code: form.postal,
          country: form.country,
          phone: form.phone,
        },
        customer_email: form.email,
        customer_name: `${form.firstName} ${form.lastName}`,
        subtotal: total,
        shipping_cost: shipping,
        total: total + shipping,
      };
      console.log('[Checkout] Appel /api/checkout/create-session', { itemsCount: items.length, total: total + shipping });
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[Checkout] Erreur create-session', res.status, data);
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }
      const url = data.url;
      const sessionId = data.sessionId;
      console.log('[Checkout] Session créée, redirection Stripe', { sessionId: sessionId ? 'ok' : 'manquant', url: url ? 'ok' : 'manquant' });
      if (!url || typeof url !== 'string') {
        throw new Error('URL Stripe manquante dans la réponse');
      }
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      console.error('[Checkout] Erreur', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !done) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: 'var(--gris)' }}>Votre panier est vide</p>
        <Link href="/shop" className="btn-primary">Voir la boutique</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>✦</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400 }}>Commande confirmée</h1>
        <p style={{ color: 'var(--gris)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.7 }}>
          Merci pour votre commande ! Vous allez recevoir un email de confirmation. Elena prépare vos bijoux avec soin.
        </p>
        <Link href="/home" className="btn-primary" style={{ marginTop: '10px' }}>Retour à l&apos;accueil</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 className="section-title" style={{ marginBottom: '50px' }}>Commande</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '60px', alignItems: 'start' }} className="checkout-layout">

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: '24px' }}>Informations de livraison</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-two-cols">
            {[
              { field: 'firstName', label: 'Prénom *',   type: 'text',  placeholder: 'Elena' },
              { field: 'lastName',  label: 'Nom *',      type: 'text',  placeholder: 'Dupont' },
            ].map(f => (
              <div key={f.field}>
                <label className="form-label">{f.label}</label>
                <input type={f.type} value={(form as never)[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} required className="form-input" />
              </div>
            ))}
          </div>

          {[
            { field: 'email',   label: 'Email *',      type: 'email', placeholder: 'elena@email.fr' },
            { field: 'phone',   label: 'Téléphone',    type: 'tel',   placeholder: '+33 6 12 34 56 78' },
            { field: 'address', label: 'Adresse *',    type: 'text',  placeholder: '12 rue des Fleurs' },
          ].map(f => (
            <div key={f.field} style={{ marginTop: '16px' }}>
              <label className="form-label">{f.label}</label>
              <input type={f.type} value={(form as never)[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} className="form-input" />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }} className="form-two-cols">
            {[
              { field: 'city',   label: 'Ville *',      placeholder: 'Paris' },
              { field: 'postal', label: 'Code postal *', placeholder: '75001' },
            ].map(f => (
              <div key={f.field}>
                <label className="form-label">{f.label}</label>
                <input type="text" value={(form as never)[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} className="form-input" />
              </div>
            ))}
          </div>

          {error && <p style={{ marginTop: '16px', color: '#c05050', fontSize: '0.85rem' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '32px', padding: '16px 40px', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Redirection vers Stripe...' : 'Payer avec Stripe'}
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--gris)', textAlign: 'center', marginTop: '12px' }}>
            Paiement sécurisé via Stripe — cartes bancaires
          </p>
        </form>

        {/* Récap commande */}
        <div style={{ background: 'var(--fond-casse)', padding: '28px', border: '1px solid var(--bordure)', position: 'sticky', top: '120px' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '20px' }}>Votre commande</h3>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ width: 50, height: 50, background: 'var(--accent-clair)', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                <Image src={item.image_url || ''} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="50px" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '2px' }}>{item.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gris)' }}>×{item.qty}</p>
              </div>
              <span style={{ fontSize: '0.85rem' }}>{fmt(item.price * item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--bordure)', marginTop: '16px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gris)', marginBottom: '8px' }}>
              <span>Livraison</span><span>{shipping === 0 ? 'Offerte' : fmt(shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif" }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem' }}>{fmt(total + shipping)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .checkout-layout{ grid-template-columns:1fr !important; }
          .form-two-cols{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
