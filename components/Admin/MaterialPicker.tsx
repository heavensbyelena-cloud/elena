'use client';

import { PRODUCT_MATERIALS, getMaterialLabel } from '@/lib/materials';
import type { ProductMaterial } from '@/types';

interface MaterialPickerProps {
  value: ProductMaterial[];
  onChange: (materials: ProductMaterial[]) => void;
}

export default function MaterialPicker({ value, onChange }: MaterialPickerProps) {
  function toggle(slug: ProductMaterial) {
    onChange(
      value.includes(slug) ? value.filter((m) => m !== slug) : [...value, slug]
    );
  }

  return (
    <div style={{ marginBottom: '18px' }}>
      <label className="form-label">Matériaux (cumulables)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {PRODUCT_MATERIALS.map(({ slug, label }) => {
          const active = value.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
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
              {label}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--gris)' }}>
          Matériaux sélectionnés :{' '}
          <strong>{value.map((s) => getMaterialLabel(s)).join(' · ')}</strong>
        </p>
      )}
    </div>
  );
}
