'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductGrid from '@/components/Product/ProductGrid';
import { CATEGORIES, getCategoryBySlugWithOverrides, isDecorationSlug, getDecorationSubcatLabel } from '@/lib/categories';
import type { CategoryImageOverrides } from '@/lib/category-images';
import { PRODUCT_MATERIALS, productMatchesMaterials } from '@/lib/materials';
import type { Product, ProductCategory, ProductMaterial } from '@/types';

const DEFAULT_SEO = {
  title: "Boutique — Heaven's By Elena",
  description:
    "Découvrez toutes les créations Heaven's By Elena : colliers, boucles d'oreilles, parures, bougies, lunettes, sacs, Homme, Enfant et décoration.",
  ogImage: 'https://placehold.co/1200x630/F5E6E0/8A8A8A?text=Heaven%27s+By+Elena',
};

function AdminRefreshButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/refresh-session', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.role === 'admin') {
        window.location.href = '/admin';
        return;
      }
      setError(data.error || 'Profil non admin dans Supabase (is_admin = true ou role = admin).');
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <button type="button" onClick={refresh} disabled={loading} style={{ background: 'var(--accent)', color: 'var(--blanc)', border: 'none', padding: '8px 14px', fontSize: '0.8rem', cursor: loading ? 'wait' : 'pointer', textDecoration: 'underline' }}>
        {loading ? 'Actualisation…' : 'Actualiser ma session'}
      </button>
      {error && <span style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', color: 'var(--gris)' }}>{error}</span>}
    </>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const adminRequired = searchParams.get('admin_required') === '1';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryImageOverrides, setCategoryImageOverrides] = useState<CategoryImageOverrides>({});
  const [activeCategory, setActive] = useState<ProductCategory | null>(null);
  const [activeMaterials, setActiveMaterials] = useState<ProductMaterial[]>([]);

  const baseUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? '';

  // Catégorie active = "decoration" si l'un des slugs décoration est sélectionné
  const isDecorationActive = activeCategory ? isDecorationSlug(activeCategory) : false;

  // Sous-catégories décoration dérivées des produits chargés (100% dynamique)
  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      if (activeCategory === 'decoration') {
        list = list.filter((p) => isDecorationSlug(p.category));
      } else {
        list = list.filter((p) => p.category === activeCategory);
      }
    }
    if (activeMaterials.length > 0) {
      list = list.filter((p) => productMatchesMaterials(p, activeMaterials));
    }
    return list;
  }, [products, activeCategory, activeMaterials]);

  const decorationSubcats = useMemo(() => {
    const slugs = [...new Set(
      products
        .filter((p) => typeof p.category === 'string' && p.category.startsWith('decoration-'))
        .map((p) => p.category)
    )].sort();
    return slugs.map(slug => ({ slug, label: getDecorationSubcatLabel(slug) }));
  }, [products]);

  const currentSeo = useMemo(() => {
    if (!activeCategory) return DEFAULT_SEO;
    const cat = getCategoryBySlugWithOverrides(activeCategory, categoryImageOverrides);
    if (cat) return cat.seo;
    // Sous-catégorie décoration : utiliser le SEO parent
    if (isDecorationSlug(activeCategory)) {
      return getCategoryBySlugWithOverrides('decoration', categoryImageOverrides)?.seo ?? DEFAULT_SEO;
    }
    return DEFAULT_SEO;
  }, [activeCategory, categoryImageOverrides]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json().catch(() => ({}));
      const list: Product[] = data.products ?? [];

      console.log('[Shop /api/products] Réponse:', {
        status: res.status,
        ok: res.ok,
        productsCount: list.length,
        products: list.length ? list.map(p => ({ id: p.id, name: p.name, category: p.category })) : '(tableau vide)',
        error: data.error ?? null,
      });

      setProducts(list);
    } catch (err) {
      console.error('[Shop /api/products] Erreur fetch:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    fetch('/api/category-images')
      .then((res) => res.json())
      .then((data) => setCategoryImageOverrides(data.overrides ?? {}))
      .catch(() => setCategoryImageOverrides({}));
  }, []);

  // Lire ?category= et ?materials= depuis l'URL
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category') as ProductCategory | null;
    if (cat) setActive(cat);
    const mats = params.get('materials');
    if (mats) {
      const slugs = mats.split(',').filter((s): s is ProductMaterial =>
        PRODUCT_MATERIALS.some((m) => m.slug === s)
      );
      if (slugs.length) setActiveMaterials(slugs);
    }
  }, [products]);

  function filterBy(cat: ProductCategory | null) {
    setActive(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleMaterial(slug: ProductMaterial) {
    setActiveMaterials((prev) =>
      prev.includes(slug) ? prev.filter((m) => m !== slug) : [...prev, slug]
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearMaterialFilters() {
    setActiveMaterials([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeMaterialLabels = useMemo(
    () => activeMaterials.map((s) => PRODUCT_MATERIALS.find((m) => m.slug === s)?.label).filter(Boolean),
    [activeMaterials]
  );

  const activeCategoryLabel = useMemo(() => {
    if (!activeCategory) return null;
    const cat = getCategoryBySlugWithOverrides(activeCategory, categoryImageOverrides);
    if (cat) return cat.label;
    // Sous-catégorie décoration : cherche dans les slugs dérivés des produits
    const sub = decorationSubcats.find(s => s.slug === activeCategory);
    return sub?.label ?? getDecorationSubcatLabel(activeCategory);
  }, [activeCategory, decorationSubcats, categoryImageOverrides]);

  useEffect(() => {
    document.title = currentSeo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', currentSeo.description);
  }, [currentSeo]);

  return (
    <div style={{ minHeight: '80vh', background: 'var(--fond)' }}>
      {adminRequired && (
        <div style={{ background: 'transparent', padding: '20px 24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--texte-muted)', letterSpacing: '0.25em', borderBottom: '1px solid var(--bordure)' }}>
          <strong>Accès admin refusé.</strong> Votre session n&apos;a pas les droits admin à jour.
          <br />
          <span style={{ marginTop: '8px', display: 'inline-block' }}>
            <AdminRefreshButton />
            {' · '}
            <Link href="/" style={{ textDecoration: 'underline', fontWeight: 600 }}>Retour et se reconnecter</Link>
          </span>
        </div>
      )}
      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${baseUrl}/shop` },
              ...(activeCategory
                ? [{ '@type': 'ListItem', position: 3, name: activeCategoryLabel ?? activeCategory, item: `${baseUrl}/shop?category=${activeCategory}` }]
                : []),
            ],
          }),
        }}
      />

      {/* En-tête */}
      <div style={{ padding: '60px 40px 40px', textAlign: 'center', borderBottom: '1px solid var(--bordure)' }}>
        <h1 className="section-title">La Boutique</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--texte-muted)', marginTop: '16px' }}>
          {filtered.length} création{filtered.length > 1 ? 's' : ''}
          {activeCategoryLabel && ` · ${activeCategoryLabel}`}
          {activeMaterialLabels.length > 0 && ` · ${activeMaterialLabels.join(', ')}`}
        </p>
      </div>

      {/* Filtres — catégories principales */}
      <div style={{ padding: '30px 40px 16px', borderBottom: isDecorationActive ? 'none' : '1px solid var(--bordure)', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--fond-casse)' }}>
        <FilterPill label="Tous les produits" active={!activeCategory} onClick={() => filterBy(null)} />
        {CATEGORIES.map(cat => (
          <FilterPill
            key={cat.slug}
            label={cat.label}
            active={activeCategory === cat.slug || (cat.slug === 'decoration' && isDecorationActive)}
            onClick={() => filterBy(cat.slug as ProductCategory)}
          />
        ))}
      </div>

      {/* Filtres — matériaux */}
      <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--bordure)', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--fond)' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--texte-muted)', alignSelf: 'center', marginRight: '4px' }}>
          Matériau
        </span>
        <FilterPill
          label="Tous"
          active={activeMaterials.length === 0}
          onClick={clearMaterialFilters}
          small
        />
        {PRODUCT_MATERIALS.map((mat) => (
          <FilterPill
            key={mat.slug}
            label={mat.label}
            active={activeMaterials.includes(mat.slug)}
            onClick={() => toggleMaterial(mat.slug)}
            small
          />
        ))}
      </div>

      {/* Sous-filtres décoration — uniquement si des produits decoration-* existent */}
      {isDecorationActive && decorationSubcats.length > 0 && (
        <div style={{ padding: '12px 40px 20px', borderBottom: '1px solid var(--bordure)', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--fond-casse)' }}>
          <FilterPill
            label="Tout voir"
            active={activeCategory === 'decoration'}
            onClick={() => filterBy('decoration')}
            small
          />
          {decorationSubcats.map(sub => (
            <FilterPill
              key={sub.slug}
              label={sub.label}
              active={activeCategory === sub.slug}
              onClick={() => filterBy(sub.slug as ProductCategory)}
              small
            />
          ))}
        </div>
      )}

      {/* Grille produits */}
      <div style={{ padding: '60px 40px' }}>
        <ProductGrid
          products={filtered}
          loading={loading}
          emptyMessage={
            activeCategoryLabel || activeMaterialLabels.length > 0
              ? `Aucun produit ne correspond à vos filtres pour le moment.`
              : 'Aucun produit disponible pour le moment.'
          }
        />
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick, small = false }: { label: string; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '6px 14px' : '8px 20px',
        border: active ? '1px solid var(--accent)' : '1px solid var(--bordure)',
        background: 'transparent',
        color: active ? 'var(--accent)' : 'var(--texte-muted)',
        fontSize: small ? '0.65rem' : '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 0 0 1px var(--accent)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement…</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
