import ProductCard from './ProductCard';
import SkeletonCard from '@/components/Common/SkeletonCard';
import type { Product } from '@/types';

interface Props {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function ProductGrid({ products, loading = false, emptyMessage = 'Aucun produit disponible.' }: Props) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  if (loading) {
    return (
      <div style={gridStyle} className="products-grid-responsive">
        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--texte-muted)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', padding: '60px 20px' }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div style={gridStyle} className="products-grid-responsive">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
