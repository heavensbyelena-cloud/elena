'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase-client';
import PromoInput from '@/components/Cart/PromoInput';

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

type ShippingMethod = 'home_delivery' | 'point_relay';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const { items, total, appliedPromo } = useCart();
  const shipping = total >= 60 ? 0 : 4.9;
  const discount = appliedPromo?.discount_amount ?? 0;
  const orderTotal = Math.max(0, total + shipping - discount);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('home_delivery');
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [widgetError, setWidgetError] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapReady = widgetStatus === 'ready';

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

  // Pré-remplir avec le profil connecté
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, default_address')
          .eq('id', user.id)
          .single();
        const profile = profileData as { first_name?: string | null; last_name?: string | null; default_address?: Record<string, unknown> | null } | null;

        const addr = (profile?.default_address || {}) as {
          first_name?: string; last_name?: string; address?: string;
          city?: string; postal_code?: string; country?: string; phone?: string;
        };

        setForm((prev) => ({
          firstName: profile?.first_name ?? addr.first_name ?? prev.firstName,
          lastName:  profile?.last_name  ?? addr.last_name  ?? prev.lastName,
          email:     user.email          ?? prev.email,
          phone:     addr.phone          ?? prev.phone,
          address:   addr.address        ?? prev.address,
          city:      addr.city           ?? prev.city,
          postal:    addr.postal_code    ?? prev.postal,
          country:   addr.country        ?? prev.country,
        }));
      } catch { /* formulaire vierge */ }
    })();
  }, []);

  // Charger le widget Mondial Relay quand "point_relay" est sélectionné
  useEffect(() => {
    if (shippingMethod !== 'point_relay') return;

    let cancelled = false;
    setWidgetStatus('loading');
    setWidgetError('');

    function loadScript(id: string, src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = document.getElementById(id) as HTMLScriptElement | null;
        if (existing) {
          // script déjà présent — attendre qu'il soit chargé si besoin
          if ((existing as HTMLScriptElement & { readyState?: string }).readyState === 'loading') {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error(`Erreur script: ${src}`)));
          } else {
            resolve();
          }
          return;
        }
        const s = document.createElement('script');
        s.id = id;
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Impossible de charger: ${src}`));
        document.head.appendChild(s);
      });
    }

    function loadStyle(id: string, href: string) {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id; l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onPointSelected(data: any) {
      if (cancelled) return;
      setPickupPoint({
        id:      data.ID        ?? data.ParcelShopID ?? '',
        name:    data.Nom       ?? data.LgAdr1       ?? '',
        address: data.Adresse1  ?? data.LgAdr3       ?? '',
        city:    data.Ville     ?? data.LgAdr4       ?? '',
        zipCode: data.CP        ?? '',
      });
      setError('');
    }

    async function initWidget() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;

        // 1. CSS Leaflet (carte OpenStreetMap)
        loadStyle('leaflet-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        // 2. CSS Mondial Relay
        loadStyle('mondial-relay-css', 'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.css');

        // 3. Supprimer les anciennes versions de scripts si présentes
        ['jquery-script', 'leaflet-script', 'mondial-relay-script'].forEach(id => {
          document.getElementById(id)?.remove();
        });

        // 4. jQuery 2.2.4 (compatible MR widget v4+)
        await loadScript('jquery-script', 'https://code.jquery.com/jquery-2.2.4.min.js');
        if (cancelled) return;
        if (!win.$) win.$ = win.jQuery;

        // 5. Leaflet JS (requis pour la carte)
        await loadScript('leaflet-script', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
        if (cancelled) return;

        // 6. Plugin Mondial Relay (URL sans numéro de version — URL officielle actuelle)
        await loadScript(
          'mondial-relay-script',
          'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js'
        );
        if (cancelled) return;

        const jq = win.jQuery;
        if (!jq) throw new Error('jQuery non disponible');

        // Le plugin s'appelle MR_ParcelShopPicker (avec underscore)
        if (!jq.fn.MR_ParcelShopPicker) {
          throw new Error(`Plugin MR_ParcelShopPicker introuvable après chargement du script`);
        }

        if (!document.getElementById('mr-widget-container')) {
          throw new Error('Conteneur #mr-widget-container introuvable dans le DOM');
        }

        jq('#mr-widget-container').MR_ParcelShopPicker({
          Target:              '#mr-selected-point',
          Brand:               'CC23VJJS',
          Country:             'FR',
          Responsive:          true,
          ShowResultsOnMap:    true,
          OnParcelShopSelected: onPointSelected,
        });

        if (!cancelled) setWidgetStatus('ready');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[Mondial Relay]', msg);
        setWidgetStatus('error');
        setWidgetError(msg);
      }
    }

    initWidget();
    return () => { cancelled = true; };
  }, [shippingMethod]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email) {
      setError('Veuillez remplir votre prénom, nom et email.');
      return;
    }

    if (shippingMethod === 'home_delivery') {
      if (!form.address || !form.city || !form.postal) {
        setError('Veuillez remplir tous les champs d\'adresse.');
        return;
      }
    }

    if (shippingMethod === 'point_relay' && !pickupPoint) {
      setError('Veuillez sélectionner un point Mondial Relay sur la carte.');
      return;
    }

    if (items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }

    setLoading(true);
    try {
      const shippingAddress = shippingMethod === 'home_delivery'
        ? { first_name: form.firstName, last_name: form.lastName, address: form.address, city: form.city, postal_code: form.postal, country: form.country, phone: form.phone }
        : { first_name: form.firstName, last_name: form.lastName, address: pickupPoint!.address, city: pickupPoint!.city, postal_code: pickupPoint!.zipCode, country: 'France', phone: form.phone };

      const payload = {
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image_url: i.image_url })),
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
        pickup_point: shippingMethod === 'point_relay' ? pickupPoint : null,
        customer_email: form.email,
        customer_name: `${form.firstName} ${form.lastName}`,
        subtotal: total,
        shipping_cost: shipping,
        total: orderTotal,
        promo_id: appliedPromo?.id ?? null,
        discount_amount: discount,
      };

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du paiement');
      if (!data.url || typeof data.url !== 'string') throw new Error('URL Stripe manquante');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
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
    <div className="checkout-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 className="section-title checkout-title" style={{ marginBottom: '50px' }}>Commande</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '60px', alignItems: 'start' }} className="checkout-layout">

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate className="checkout-form">

          {/* Infos personnelles */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: '24px' }}>
            Informations personnelles
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-two-cols">
            {[
              { field: 'firstName', label: 'Prénom *', placeholder: 'Elena' },
              { field: 'lastName',  label: 'Nom *',    placeholder: 'Dupont' },
            ].map(f => (
              <div key={f.field}>
                <label className="form-label">{f.label}</label>
                <input type="text" value={(form as never)[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} required className="form-input" />
              </div>
            ))}
          </div>

          {[
            { field: 'email', label: 'Email *',    type: 'email', placeholder: 'elena@email.fr' },
            { field: 'phone', label: 'Téléphone',  type: 'tel',   placeholder: '+33 6 12 34 56 78' },
          ].map(f => (
            <div key={f.field} style={{ marginTop: '16px' }}>
              <label className="form-label">{f.label}</label>
              <input type={f.type} value={(form as never)[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} className="form-input" />
            </div>
          ))}

          {/* Choix du mode de livraison */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', letterSpacing: '0.1em', marginTop: '36px', marginBottom: '20px' }}>
            Mode de livraison
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { value: 'home_delivery', label: 'Livraison à domicile', desc: 'Livraison Colissimo à votre adresse' },
              { value: 'point_relay',   label: 'Point Mondial Relay',   desc: 'Retrait gratuit en point relais' },
            ].map(opt => (
              <label
                key={opt.value}
                className="shipping-option"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
                  border: `1px solid ${shippingMethod === opt.value ? 'var(--accent, #b8956a)' : 'var(--bordure)'}`,
                  background: shippingMethod === opt.value ? 'var(--accent-clair, #faf5ef)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={opt.value}
                  checked={shippingMethod === opt.value}
                  onChange={() => { setShippingMethod(opt.value as ShippingMethod); setPickupPoint(null); setMapReady(false); setError(''); }}
                  style={{ marginTop: '3px', accentColor: 'var(--accent, #b8956a)' }}
                />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '2px' }}>{opt.label}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gris)' }}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Adresse domicile */}
          {shippingMethod === 'home_delivery' && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Adresse *</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="12 rue des Fleurs" className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-two-cols">
                <div>
                  <label className="form-label">Ville *</label>
                  <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Paris" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Code postal *</label>
                  <input type="text" value={form.postal} onChange={e => update('postal', e.target.value)} placeholder="75001" className="form-input" />
                </div>
              </div>
            </div>
          )}

          {/* Widget Mondial Relay */}
          {shippingMethod === 'point_relay' && (
            <div style={{ marginTop: '24px' }}>
              {/* Point sélectionné */}
              {pickupPoint && (
                <div style={{
                  padding: '14px 16px', marginBottom: '16px',
                  border: '1px solid var(--accent, #b8956a)',
                  background: 'var(--accent-clair, #faf5ef)',
                  fontSize: '0.85rem', lineHeight: 1.6,
                }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>✓ Point sélectionné</p>
                  <p style={{ fontWeight: 500 }}>{pickupPoint.name}</p>
                  <p style={{ color: 'var(--gris)' }}>{pickupPoint.address}</p>
                  <p style={{ color: 'var(--gris)' }}>{pickupPoint.zipCode} {pickupPoint.city}</p>
                </div>
              )}

              {/* Conteneur de la carte */}
              <div ref={mapContainerRef}>
                <input type="hidden" id="mr-selected-point" />

                {widgetStatus === 'error' ? (
                  <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#c05050', fontWeight: 500, marginBottom: '6px' }}>
                      Impossible de charger la carte Mondial Relay
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#c05050', marginBottom: '12px' }}>
                      {widgetError}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setWidgetStatus('idle'); setShippingMethod('home_delivery'); setTimeout(() => setShippingMethod('point_relay'), 50); }}
                      style={{ fontSize: '0.8rem', padding: '6px 14px', border: '1px solid #c05050', background: 'white', cursor: 'pointer', color: '#c05050' }}
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div
                    id="mr-widget-container"
                    style={{ width: '100%', minHeight: '420px', border: '1px solid var(--bordure)', position: 'relative' }}
                  />
                )}

                {widgetStatus === 'loading' && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris)', marginTop: '8px', textAlign: 'center' }}>
                    Chargement de la carte…
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <p style={{ marginTop: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#c05050', fontSize: '0.85rem' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary btn-pay" style={{ marginTop: '32px', padding: '16px 40px', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Redirection en cours…' : 'Payer'}
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--gris)', textAlign: 'center', marginTop: '12px' }}>
            Paiement sécurisé — cartes bancaires
          </p>
        </form>

        {/* Récap commande */}
        <div className="checkout-recap" style={{ background: 'var(--fond-casse)', padding: '28px', border: '1px solid var(--bordure)', position: 'sticky', top: '120px' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '20px' }}>
            Votre commande
          </h3>
          <div style={{ marginBottom: '18px' }}>
            <PromoInput />
          </div>
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

          {/* Résumé livraison */}
          <div style={{ borderTop: '1px solid var(--bordure)', marginTop: '16px', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--gris)', marginBottom: '10px', padding: '8px 10px', background: 'white', border: '1px solid var(--bordure)' }}>
              {shippingMethod === 'home_delivery' ? (
                <>
                  <p style={{ fontWeight: 500, marginBottom: '2px' }}>Livraison à domicile</p>
                  {form.address ? (
                    <p>{form.address}, {form.postal} {form.city}</p>
                  ) : (
                    <p style={{ fontStyle: 'italic' }}>Adresse non renseignée</p>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 500, marginBottom: '2px' }}>Point Mondial Relay</p>
                  {pickupPoint ? (
                    <p>{pickupPoint.name} — {pickupPoint.zipCode} {pickupPoint.city}</p>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#c05050' }}>Aucun point sélectionné</p>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gris)', marginBottom: '8px' }}>
              <span>Livraison</span><span>{shipping === 0 ? 'Offerte' : fmt(shipping)}</span>
            </div>
            {appliedPromo && discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '8px' }}>
                <span>Code {appliedPromo.code}</span>
                <span>−{fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif" }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem' }}>{fmt(orderTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Mobile ── */
        @media(max-width: 768px) {
          .checkout-wrapper {
            padding: 32px 16px !important;
          }
          .checkout-title {
            font-size: 1.6rem !important;
            margin-bottom: 28px !important;
          }
          .checkout-layout {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          /* Récap commande au-dessus du formulaire sur mobile */
          .checkout-recap {
            order: -1;
            position: static !important;
            margin-bottom: 32px;
            padding: 20px !important;
          }
          .checkout-form {
            order: 1;
          }
          .form-two-cols {
            grid-template-columns: 1fr !important;
          }
          /* Boutons radio livraison — zone de tap plus grande */
          .shipping-option {
            padding: 16px 14px !important;
          }
          /* Widget MR — hauteur réduite sur mobile */
          #mr-widget-container {
            min-height: 340px !important;
          }
          /* Bouton payer — taille confortable */
          .btn-pay {
            padding: 18px 24px !important;
            font-size: 1rem !important;
          }
        }

        /* ── Très petit écran ── */
        @media(max-width: 400px) {
          .checkout-wrapper {
            padding: 24px 12px !important;
          }
          .checkout-recap {
            padding: 16px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
