'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, getResineSubcatLabel } from '@/lib/categories';

interface Props {
  /** Slug actuel (ex: 'resine-plateaux') — vide si pas encore choisi */
  value: string;
  onChange: (slug: string) => void;
}

/** Convertit un texte libre en slug résine : "Miroirs en résine" → "resine-miroirs-en-resine" */
function toResineSlug(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // supprime les accents
    .replace(/[^a-z0-9]+/g, '-')      // remplace tout sauf lettres/chiffres par -
    .replace(/(^-|-$)/g, '');          // supprime les - en début/fin
  return `resine-${base}`;
}

export default function ResineSubcatField({ value, onChange }: Props) {
  const [dbSubcats, setDbSubcats] = useState<{ slug: string; label: string }[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [newName, setNewName] = useState('');

  // Charge les sous-catégories résine déjà présentes dans les produits en base
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const products: { category: string }[] = data.products ?? [];
        const slugs = [...new Set(
          products
            .filter(p => p.category?.startsWith('resine-'))
            .map(p => p.category)
        )];
        setDbSubcats(slugs.map(slug => ({ slug, label: getResineSubcatLabel(slug) })));
      })
      .catch(() => {});
  }, []);

  // Fusionne config statique + sous-catégories en base (sans doublons)
  const configSubcats = CATEGORIES.find(c => c.slug === 'resine')?.subcategories ?? [];
  const allSubcats = [
    ...configSubcats,
    ...dbSubcats.filter(db => !configSubcats.find(c => c.slug === db.slug)),
  ];

  const generatedSlug = newName.trim() ? toResineSlug(newName.trim()) : '';

  function handleSelectChange(val: string) {
    if (val === '__new__') {
      setIsNew(true);
      onChange('');
    } else {
      setIsNew(false);
      setNewName('');
      onChange(val);
    }
  }

  function handleNewNameChange(text: string) {
    setNewName(text);
    onChange(text.trim() ? toResineSlug(text.trim()) : '');
  }

  // Si la valeur actuelle n'est pas dans la liste connue, on est en mode "nouvelle"
  const selectValue = isNew
    ? '__new__'
    : (value && !allSubcats.find(s => s.slug === value) ? '__new__' : (value || ''));

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: 'var(--fond-casse)',
      border: '1px solid var(--bordure)',
      borderLeft: '3px solid var(--accent)',
    }}>
      <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
        Sous-catégorie résine *
      </label>

      <select
        value={selectValue}
        onChange={e => handleSelectChange(e.target.value)}
        className="form-input"
        style={{ appearance: 'none', marginBottom: isNew ? '10px' : '0' }}
      >
        <option value="">— Choisir une sous-catégorie —</option>
        {allSubcats.map(sub => (
          <option key={sub.slug} value={sub.slug}>{sub.label}</option>
        ))}
        <option value="__new__">➕  Nouvelle sous-catégorie…</option>
      </select>

      {isNew && (
        <div>
          <input
            type="text"
            value={newName}
            onChange={e => handleNewNameChange(e.target.value)}
            placeholder="Ex : Miroirs en résine"
            className="form-input"
            autoFocus
          />
          {generatedSlug && (
            <p style={{ fontSize: '0.72rem', color: 'var(--gris)', marginTop: '8px' }}>
              Slug généré :{' '}
              <code style={{
                background: 'var(--fond)',
                border: '1px solid var(--bordure)',
                padding: '2px 8px',
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
              }}>
                {generatedSlug}
              </code>
              <span style={{ marginLeft: '8px', opacity: 0.6 }}>
                (enregistré automatiquement)
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
