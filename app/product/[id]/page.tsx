import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-server';
import ReviewList from '@/components/Reviews/ReviewList';
import ReviewForm from '@/components/Reviews/ReviewForm';
import AddToCartButton from '@/components/Product/AddToCartButton';
import ProductGallery from '@/components/Product/ProductGallery';
import { getProductImages } from '@/lib/product-images';
import { formatMaterialsList } from '@/lib/materials';
import type { Product, Review } from '@/types';

interface Props { params: Promise<{ id: string }> }

async function getProduct(id: string): Promise<Product | null> {
  try {
    console.log('[product/[id]] getProduct — ID reçu:', id, '| Requête: SELECT * FROM products WHERE id = ?');
    const admin = createAdminClient();
    const { data, error } = await admin.from('products').select('*').eq('id', id).single();
    if (error) {
      console.error('[product/[id]] getProduct — Erreur Supabase:', { message: error.message, code: error.code, details: error.details });
      return null;
    }
    const productData = data as Record<string, unknown>;
    console.log('[product/[id]] getProduct — Produit trouvé:', data ? { id: productData.id, name: productData.name, description: productData.description, descriptionLength: typeof productData.description === 'string' ? productData.description.length : 'absent/null' } : 'non');
    return (data as Product) ?? null;
  } catch (err) {
    console.error('[product/[id]] getProduct — Exception:', err);
    return null;
  }
}

async function getReviews(productId: string): Promise<{ reviews: Review[]; avg: number }> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('reviews')
      .select('id, rating, comment, author_name, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);
    const reviews = (data as Review[]) ?? [];
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { reviews, avg };
  } catch { return { reviews: [], avg: 0 }; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: 'Produit introuvable' };
  return {
    title: p.name,
    description: p.description ?? `Découvrez ${p.name} — bijou fait main par Elena.`,
    openGraph: { title: `${p.name} | Heaven's By Elena`, images: p.image_url ? [{ url: p.image_url }] : [] },
  };
}

function fmt(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'; }

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  console.log('[product/[id]] Page — params.id:', id);
  const product = await getProduct(id);
  if (!product) {
    console.log('[product/[id]] Page — produit non trouvé, notFound()');
    notFound();
  }

  const { reviews, avg } = await getReviews(id);
  const galleryImages = getProductImages(product);

  console.log('[product/[id]] Page — product.description:', product.description, '| type:', typeof product.description, '| truthy:', !!product.description);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? '',
    image: getProductImages(product),
    offers: { '@type': 'Offer', price: product.price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
    ...(reviews.length > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ── Fil d'Ariane */}
      <nav style={{ padding: '16px 40px', fontSize: '0.75rem', color: 'var(--texte-muted)', letterSpacing: '0.1em', background: 'var(--fond)' }}>
        <a href="/home" style={{ color: 'var(--texte-muted)', textDecoration: 'none' }}>Accueil</a>
        {' / '}
        <a href="/shop" style={{ color: 'var(--texte-muted)', textDecoration: 'none' }}>Boutique</a>
        {' / '}
        <span style={{ color: 'var(--accent)' }}>{product.name}</span>
      </nav>

      {/* ── Produit ── */}
      <section style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1200px', margin: '0 auto', alignItems: 'start', background: 'var(--fond)' }} className="product-detail-grid">

        <ProductGallery images={galleryImages} alt={product.name} badge={product.badge} />

        {/* Infos */}
        <div style={{ paddingTop: '20px' }}>
          {product.category && (
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '12px' }}>
              {product.category}
            </p>
          )}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 400, marginBottom: '16px', lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', marginBottom: '28px', color: 'var(--accent)' }}>
            {fmt(product.price)}
          </p>
          {formatMaterialsList(product.materials) && (
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '20px' }}>
              {formatMaterialsList(product.materials)}
            </p>
          )}
          {/* Description : toujours afficher la section (avec fallback si vide) */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--texte-muted)', lineHeight: 1.8 }}>
              {product.description?.trim() ? product.description : 'Aucune description pour ce produit.'}
            </p>
          </div>

          <AddToCartButton product={product} />

          {/* Infos livraison */}
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--bordure)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              '✓ Livraison offerte dès 60€',
              '✓ Retours acceptés sous 14 jours',
              '✓ Pièce artisanale, faite main',
            ].map(t => (
              <p key={t} style={{ fontSize: '0.8rem', color: 'var(--texte-muted)', letterSpacing: '0.05em' }}>{t}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avis ── */}
      <section style={{ padding: '80px 40px', background: 'var(--fond-casse)' }}>
        <h2 className="section-title" style={{ marginBottom: '50px' }}>Avis clients</h2>
        <ReviewList reviews={reviews} averageRating={avg} totalCount={reviews.length} />
        <div style={{ marginTop: '60px' }}>
          <ReviewForm productId={id} />
        </div>
      </section>

      <style>{`
        @media(max-width:768px){
          .product-detail-grid{ grid-template-columns:1fr !important; gap:40px !important; }
        }
      `}</style>
    </>
  );
}
