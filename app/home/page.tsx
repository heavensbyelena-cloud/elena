import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductGrid from '@/components/Product/ProductGrid';
import HeroSection from '@/components/Hero/HeroSection';
import { createAdminClient } from '@/lib/supabase-server';
import { CATEGORIES } from '@/lib/categories';
import { SEO, SITE_URL, OPEN_GRAPH_DEFAULTS, TWITTER_DEFAULTS } from '@/lib/seo';
import { organizationSchema, websiteSchema, localBusinessSchema, jsonLd } from '@/lib/schema';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: SEO.home.title,
  description: SEO.home.description,
  keywords: SEO.home.keywords,
  alternates: {
    canonical: `${SITE_URL}/home`,
  },
  openGraph: {
    title: SEO.home.title,
    description: SEO.home.description,
    url: `${SITE_URL}/home`,
    siteName: OPEN_GRAPH_DEFAULTS.siteName,
    locale: OPEN_GRAPH_DEFAULTS.locale,
    type: OPEN_GRAPH_DEFAULTS.type,
    images: [
      {
        url: SEO.home.ogImage,
        width: 1200,
        height: 630,
        alt: "Heaven's By Elena — Bijoux artisanaux faits main",
      },
    ],
  },
  twitter: {
    card: TWITTER_DEFAULTS.card,
    site: TWITTER_DEFAULTS.site,
    title: SEO.home.title,
    description: SEO.home.description,
    images: [SEO.home.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const ENGAGEMENTS = [
  { icon: '✦', title: 'Fait main en France',             sub: 'Créations artisanales' },
  { icon: '◇', title: 'Acier inoxydable',                sub: 'Qualité durable' },
  { icon: '⬡', title: 'Livraison soignée',               sub: 'Emballage luxueux' },
  { icon: '↺', title: 'Retours 14 jours',                sub: 'Satisfait ou remboursé' },
];

async function getBestSellers(): Promise<Product[]> {
  try {
    const supabase = createAdminClient();
    // Récupère les 20 derniers produits actifs
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, badge, category, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    const all = (data as Product[]) ?? [];

    // Filtre les Best-sellers en JS (évite les problèmes de casse / ilike)
    const bestSellers = all.filter(p =>
      p.badge?.toLowerCase().includes('best-seller')
    );

    // Retourne les Best-sellers s'il y en a, sinon les 4 plus récents
    return bestSellers.length > 0 ? bestSellers.slice(0, 4) : all.slice(0, 4);
  } catch { return []; }
}

export default async function HomePage() {
  const products = await getBestSellers();

  return (
    <>
      {/* ── JSON-LD Structured Data ───────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessSchema()) }} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <HeroSection
        heading="Bijoux artisanaux français faits main"
        subheading="Créations uniques par Elena"
        description="Chaque bijou est façonné à la main avec passion, en acier inoxydable. Colliers, boucles d'oreilles, parures et créations en résine — des pièces artisanales uniques, pensées pour durer et sublimer chaque tenue. Découvrez l'univers Heaven's By Elena, où l'élégance rencontre le savoir-faire artisanal français."
        imageSrc="https://placehold.co/800x1000/0E0D0B/8FD5D1?text=Heaven%27s"
        imageAlt="Bijoux artisanaux faits main par Elena — colliers et boucles d'oreilles en acier inoxydable"
        ctas={[
          { label: 'Découvrir la boutique', href: '/shop', variant: 'primary' },
          { label: 'Nos créations', href: '/shop', variant: 'secondary' },
          { label: 'Notre histoire', href: '/home#histoire', variant: 'ghost' },
        ]}
      />

      {/* ── CATÉGORIES ───────────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--fond)' }} id="boutique">
        <h2 className="section-title" style={{ marginBottom: '60px' }}>Explorer</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1200px', margin: '0 auto' }} className="cats-grid">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/shop?category=${cat.slug}`} style={{ textAlign: 'center', textDecoration: 'none', color: 'var(--texte)', display: 'block', transition: 'all 0.3s ease' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px', background: 'var(--fond-carte)', position: 'relative', border: '1px solid var(--bordure)', transition: 'all 0.3s ease' }}>
                <Image src={cat.img} alt={cat.label} fill sizes="300px" style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }} unoptimized={cat.img.includes('placehold.co')} />
              </div>
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)' }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MEILLEURES VENTES ────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--fond-casse)' }}>
        <h2 className="section-title" style={{ marginBottom: '60px' }}>Meilleures ventes</h2>
        <ProductGrid products={products} emptyMessage="Aucun produit disponible pour le moment." />
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Link href="/shop" className="btn-secondary">Voir tous les produits</Link>
        </div>
      </section>

      {/* ── NOTRE HISTOIRE ───────────────────────────────── */}
      <section id="histoire" className="section-padding" style={{ background: 'var(--fond)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="story-grid">
          <div style={{ width: '100%', aspectRatio: '4/5', background: "url('https://placehold.co/500x600/0E0D0B/8FD5D1?text=Elena') center/cover no-repeat", borderRadius: '2px', border: '1px solid var(--bordure)' }} role="img" aria-label="Elena créatrice" />
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 400, letterSpacing: '0.2em', marginBottom: '28px', color: 'var(--texte)' }}>Notre histoire</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--texte-muted)', lineHeight: 1.8, marginBottom: '16px' }}>
              Elena crée ses bijoux à la main, avec passion et minutie. Chaque pièce est façonnée en acier inoxydable, en série limitée, pour vous offrir des créations durables et élégantes.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--texte-muted)', lineHeight: 1.8 }}>
              Un acier inoxydable soigné, un savoir-faire artisanal et une attention portée à chaque détail : voilà ce qui fait l&apos;âme de Heaven&apos;s By Elena.
            </p>
          </div>
        </div>
      </section>

      {/* ── ENGAGEMENTS ──────────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--fond-casse)' }}>
        <h2 className="section-title" style={{ marginBottom: '60px' }}>Nos engagements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '50px', maxWidth: '1000px', margin: '0 auto' }} className="engage-grid">
          {ENGAGEMENTS.map(e => (
            <div key={e.title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', color: 'var(--accent)', marginBottom: '16px' }}>{e.icon}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '6px', color: 'var(--texte)' }}>{e.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--texte-muted)' }}>{e.sub}</p>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}
