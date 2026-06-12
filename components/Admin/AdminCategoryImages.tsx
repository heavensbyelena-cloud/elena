'use client';

import { useRef, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import type { CategoryImageOverrides } from '@/lib/category-images';

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error(
        'Photo trop lourde pour le serveur (max ~4,5 Mo en ligne). Réduisez la taille du fichier ou compressez-la.'
      );
    }
    throw new Error(data.error || "Échec de l'upload de l'image.");
  }
  const { url } = await res.json();
  return url as string;
}

interface AdminCategoryImagesProps {
  initialOverrides: CategoryImageOverrides;
  isMobile?: boolean;
}

export default function AdminCategoryImages({ initialOverrides, isMobile = false }: AdminCategoryImagesProps) {
  const [overrides, setOverrides] = useState<CategoryImageOverrides>(initialOverrides);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function displayUrl(slug: string, defaultUrl: string) {
    return overrides[slug] ?? defaultUrl;
  }

  async function handleFileChange(slug: string, file: File | undefined) {
    if (!file) return;
    setBusySlug(slug);
    setMsg(null);
    try {
      const imageUrl = await uploadFile(file);
      const res = await fetch('/api/category-images', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, image_url: imageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Impossible de sauvegarder la photo.');
      setOverrides((prev) => ({ ...prev, [slug]: imageUrl }));
      setMsg({ text: 'Photo de catégorie mise à jour.', type: 'success' });
    } catch (err) {
      setMsg({
        text: err instanceof Error ? err.message : 'Une erreur est survenue.',
        type: 'error',
      });
    } finally {
      setBusySlug(null);
      const input = inputRefs.current[slug];
      if (input) input.value = '';
    }
  }

  async function handleReset(slug: string) {
    setBusySlug(slug);
    setMsg(null);
    try {
      const res = await fetch(`/api/category-images?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Impossible de réinitialiser la photo.');
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      setMsg({ text: 'Photo par défaut restaurée.', type: 'success' });
    } catch (err) {
      setMsg({
        text: err instanceof Error ? err.message : 'Une erreur est survenue.',
        type: 'error',
      });
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? '1.4rem' : '2rem',
          fontWeight: 400,
          marginBottom: '12px',
        }}
      >
        Photos des catégories
      </h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
        Changez les visuels affichés sur la page d&apos;accueil (section Explorer). JPEG, PNG, WebP ou GIF — max 15 Mo.
        Format portrait recommandé (ratio 3/4).
      </p>

      {msg && (
        <p
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            background: msg.type === 'success' ? 'rgba(90,138,90,0.12)' : 'rgba(192,80,80,0.12)',
            color: msg.type === 'success' ? '#3d6b3d' : '#a04040',
            border: `1px solid ${msg.type === 'success' ? 'rgba(90,138,90,0.3)' : 'rgba(192,80,80,0.3)'}`,
          }}
        >
          {msg.text}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px',
        }}
      >
        {CATEGORIES.map((cat) => {
          const url = displayUrl(cat.slug, cat.img);
          const isBusy = busySlug === cat.slug;
          const hasOverride = Boolean(overrides[cat.slug]);

          return (
            <div
              key={cat.slug}
              style={{
                border: '1px solid var(--bordure)',
                padding: isMobile ? '16px' : '20px',
                background: 'var(--fond-carte)',
              }}
            >
              <p
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--texte-muted)',
                  marginBottom: '12px',
                }}
              >
                {cat.label}
              </p>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3/4',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '14px',
                  background: 'var(--fond)',
                  border: '1px solid var(--bordure)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={cat.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: cat.imgObjectFit ?? 'cover',
                    opacity: isBusy ? 0.5 : 1,
                  }}
                />
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[cat.slug] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(cat.slug, e.target.files?.[0])}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => inputRefs.current[cat.slug]?.click()}
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '1px solid var(--noir)',
                    background: 'var(--noir)',
                    color: 'var(--blanc)',
                    cursor: isBusy ? 'wait' : 'pointer',
                  }}
                >
                  {isBusy ? 'Envoi…' : 'Changer la photo'}
                </button>
                {hasOverride && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleReset(cat.slug)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.68rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: '1px solid var(--bordure)',
                      background: 'transparent',
                      color: 'var(--gris)',
                      cursor: isBusy ? 'wait' : 'pointer',
                    }}
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
