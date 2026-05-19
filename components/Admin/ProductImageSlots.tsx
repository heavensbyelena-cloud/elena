'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { MAX_IMAGES } from '@/lib/product-images';

export type ImageSlot = {
  file: File | null;
  previewUrl: string | null;
  existingUrl: string | null;
};

export function emptyImageSlots(): ImageSlot[] {
  return Array.from({ length: MAX_IMAGES }, () => ({
    file: null,
    previewUrl: null,
    existingUrl: null,
  }));
}

export function slotsFromUrls(urls: string[]): ImageSlot[] {
  const base = emptyImageSlots();
  urls.slice(0, MAX_IMAGES).forEach((url, i) => {
    base[i] = { file: null, previewUrl: null, existingUrl: url };
  });
  return base;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Échec de l'upload de l'image.");
  }
  const { url } = await res.json();
  return url as string;
}

export async function resolveImageUrls(slots: ImageSlot[]): Promise<string[]> {
  const urls: string[] = [];
  for (const slot of slots) {
    if (slot.file) {
      urls.push(await uploadFile(slot.file));
    } else if (slot.existingUrl) {
      urls.push(slot.existingUrl);
    }
  }
  return urls;
}

interface ProductImageSlotsProps {
  slots: ImageSlot[];
  onChange: (slots: ImageSlot[]) => void;
  requiredCount?: number;
}

export default function ProductImageSlots({ slots, onChange, requiredCount = 1 }: ProductImageSlotsProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => {
      slots.forEach((s) => {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSlot(index: number, patch: Partial<ImageSlot>) {
    onChange(slots.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function handleFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const prev = slots[index];
    if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);

    updateSlot(index, {
      file,
      previewUrl: URL.createObjectURL(file),
      existingUrl: null,
    });
  }

  function clearSlot(index: number) {
    const prev = slots[index];
    if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
    if (inputRefs.current[index]) inputRefs.current[index]!.value = '';
    updateSlot(index, { file: null, previewUrl: null, existingUrl: null });
  }

  const displaySrc = (slot: ImageSlot) => slot.previewUrl || slot.existingUrl;

  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="form-label">
        Photos du produit ({requiredCount} minimum, {MAX_IMAGES} maximum)
      </label>
      <p style={{ fontSize: '0.75rem', color: 'var(--gris)', marginBottom: '12px' }}>
        JPEG, PNG, WebP ou GIF — max 15 Mo par photo
      </p>
      <div style={{ display: 'grid', gap: '20px' }}>
        {slots.map((slot, i) => {
          const src = displaySrc(slot);
          const isRequired = i < requiredCount;
          return (
            <div key={i}>
              <p style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '8px' }}>
                Photo {i + 1}
                {isRequired ? ' *' : ' (optionnelle)'}
              </p>
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(i, e)}
                className="form-input"
                style={{ padding: '8px', marginBottom: '8px' }}
              />
              {src ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ position: 'relative', width: 100, height: 100, border: '1px solid var(--bordure)', overflow: 'hidden' }}>
                    <Image
                      src={src}
                      alt={`Aperçu photo ${i + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="100px"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => clearSlot(i)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.72rem',
                      background: 'transparent',
                      border: '1px solid var(--bordure)',
                      color: 'var(--gris)',
                      cursor: 'pointer',
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
