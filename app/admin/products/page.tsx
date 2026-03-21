import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminProductActions from './AdminProductActions';

export default async function AdminProductsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login');
  const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  const profile = profileData as { is_admin?: boolean } | null;
  if (!profile?.is_admin) redirect('/');

  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400 }}>Produits</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Ajouter un produit</Link>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[{ label: 'Dashboard', href: '/admin' },{ label: 'Produits', href: '/admin/products', active: true },{ label: 'Commandes', href: '/admin/orders' },{ label: 'Avis', href: '/admin/reviews' }].map(l => (
          <Link key={l.label} href={l.href} style={{ padding: '8px 20px', background: l.active ? 'var(--noir)' : 'transparent', color: l.active ? 'var(--blanc)' : 'var(--gris)', border: '1px solid ' + (l.active ? 'var(--noir)' : 'var(--bordure)'), fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bordure)' }}>
              {['Image','Nom','Catégorie','Prix','Stock','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: { id: string; image_url: string; name: string; category: string; price: number; stock: number }) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--bordure)' }}>
                <td style={{ padding: '12px 16px' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: 50, height: 50, objectFit: 'cover', background: 'var(--accent-clair)' }} />
                    : <div style={{ width: 50, height: 50, background: 'var(--accent-clair)' }} />}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--gris)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>{p.price?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                <td style={{ padding: '12px 16px', color: p.stock === 0 ? '#c05050' : 'var(--gris)' }}>{p.stock ?? '∞'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <AdminProductActions productId={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucun produit encore ajouté.</p>
        )}
      </div>
    </div>
  );
}
