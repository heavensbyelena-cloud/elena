'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProductCategory } from '@/types';
import { CATEGORIES } from '@/lib/categories';
import ResineSubcatField from '@/components/Admin/ResineSubcatField';

// Catégories parentes uniquement (pas les sous-catégories résine — gérées séparément)
const CATS: { slug: string; label: string }[] = CATEGORIES.map(cat => ({
  slug: cat.slug,
  label: cat.label,
}));

// Badges prédéfinis, sélectionnables et cumulables
const BADGES: string[] = ['Fait main', 'Nouveau', 'Best-seller', 'Pièce unique', 'Edition limitée'];

export default function AdminNewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    badge: '',
    stock: '',
  });
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // "resine" = catégorie parente sélectionnée → affiche ResineSubcatField
  const parentCategory = form.category.startsWith('resine-') ? 'resine' : form.category;
  const isResineParent = parentCategory === 'resine';

  function handleParentCategoryChange(slug: string) {
    if (slug === 'resine') {
      // On garde 'resine' temporairement — ResineSubcatField posera le vrai slug
      update('category', 'resine');
    } else {
      update('category', slug);
    }
  }

  function update(k: string, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPEG, PNG, WebP, GIF).');
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    setError('');
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function toggleBadge(badge: string) {
    setSelectedBadges((prev) => {
      const exists = prev.includes(badge);
      const next = exists ? prev.filter((b) => b !== badge) : [...prev, badge];
      // On stocke dans form.badge une chaîne lisible, cumulable
      setForm((current) => ({
        ...current,
        badge: next.join(' / '),
      }));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || form.category === 'resine') {
      setError(form.category === 'resine'
        ? 'Veuillez choisir ou créer une sous-catégorie résine.'
        : 'Nom, prix et catégorie sont requis.');
      return;
    }
    if (!imageFile) {
      setError('Veuillez sélectionner une photo pour le produit.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || 'Échec de l\'upload de l\'image.');
      }
      const { url } = await uploadRes.json();

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          image_url: url,
          price: parseFloat(form.price),
          stock: form.stock ? parseInt(form.stock) : null,
        }),
      });
      if (!res.ok) throw new Error();
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du produit.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <Link href="/admin" style={{ color: 'var(--gris)', textDecoration: 'none', fontSize: '0.8rem' }}>← Retour</Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 400 }}>Nouveau produit</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {[
          { key: 'name', label: 'Nom *', type: 'text', placeholder: 'Collier Lumière' },
          { key: 'price', label: 'Prix (€) *', type: 'number', placeholder: '65.00' },
          { key: 'stock', label: 'Stock', type: 'number', placeholder: 'Laisser vide = illimité' },
        ].map((f) => (
          <div key={f.key} style={{ marginBottom: '18px' }}>
            <label className="form-label">{f.label}</label>
            <input
              type={f.type}
              value={(form as Record<string, string>)[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="form-input"
              step={f.type === 'number' ? '0.01' : undefined}
            />
          </div>
        ))}

        {/* Badges sélectionnables et cumulables */}
        <div style={{ marginBottom: '18px' }}>
          <label className="form-label">Badges (cumulables)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {BADGES.map((badge) => {
              const active = selectedBadges.includes(badge);
              return (
                <button
                  key={badge}
                  type="button"
                  onClick={() => toggleBadge(badge)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    border: active ? '1px solid var(--noir)' : '1px solid var(--bordure)',
                    background: active ? 'var(--noir)' : 'transparent',
                    color: active ? 'var(--blanc)' : 'var(--gris)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                  }}
                >
                  {badge}
                </button>
              );
            })}
          </div>
          {form.badge && (
            <p style={{ fontSize: '0.78rem', color: 'var(--gris)' }}>
              Badges sélectionnés : <strong>{form.badge}</strong>
            </p>
          )}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label className="form-label">Photo du produit *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="form-input"
            style={{ padding: '10px' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--gris)', marginTop: '6px' }}>JPEG, PNG, WebP ou GIF — max 5 Mo</p>
        </div>

        {imagePreviewUrl && (
          <div style={{ marginBottom: '24px' }}>
            <p className="form-label">Aperçu</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <img src={imagePreviewUrl} alt="Aperçu" style={{ width: '160px', height: '160px', objectFit: 'cover', background: 'var(--accent-clair)', border: '1px solid var(--bordure)' }} />
              <button type="button" onClick={clearImage} style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--bordure)', color: 'var(--gris)', cursor: 'pointer' }}>
                Changer l&apos;image
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '18px' }}>
          <label className="form-label">Catégorie *</label>
          <select
            value={parentCategory}
            onChange={e => handleParentCategoryChange(e.target.value)}
            className="form-input"
            style={{ appearance: 'none' }}
          >
            <option value="">— Choisir —</option>
            {CATS.map(c => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>

          {/* Sous-catégorie résine — apparaît uniquement si "Création Résine" est choisi */}
          {isResineParent && (
            <ResineSubcatField
              value={form.category.startsWith('resine-') ? form.category : ''}
              onChange={slug => update('category', slug || 'resine')}
            />
          )}
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label className="form-label">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Description du produit…" rows={4} className="form-input" style={{ resize: 'vertical' }} />
        </div>

        {error && <p style={{ color: '#c05050', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px 32px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Création…' : 'Créer le produit'}
          </button>
          <Link href="/admin" className="btn-secondary" style={{ padding: '14px 24px' }}>Annuler</Link>
        </div>
      </form>
    </div>
  );
}
