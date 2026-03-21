import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminReviewActions from './AdminReviewActions';

export default async function AdminReviewsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login');
  const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  const profile = profileData as { is_admin?: boolean } | null;
  if (!profile?.is_admin) redirect('/');

  const filter = searchParams?.status ?? 'pending';

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, author_name, status, created_at')
    .eq('status', filter)
    .order('created_at', { ascending: false });

  function stars(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, marginBottom: '30px' }}>Modération des avis</h1>

      <nav style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[{ label: 'Dashboard', href: '/admin' },{ label: 'Produits', href: '/admin/products' },{ label: 'Commandes', href: '/admin/orders' },{ label: 'Avis', href: '/admin/reviews', active: true }].map(l => (
          <Link key={l.label} href={l.href} style={{ padding: '8px 20px', background: l.active ? 'var(--noir)' : 'transparent', color: l.active ? 'var(--blanc)' : 'var(--gris)', border: '1px solid ' + (l.active ? 'var(--noir)' : 'var(--bordure)'), fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {[{ val: 'pending', label: 'En attente' },{ val: 'approved', label: 'Approuvés' },{ val: 'rejected', label: 'Refusés' }].map(f => (
          <Link key={f.val} href={`/admin/reviews?status=${f.val}`} style={{ padding: '6px 18px', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid ' + (filter === f.val ? 'var(--noir)' : 'var(--bordure)'), background: filter === f.val ? 'var(--noir)' : 'transparent', color: filter === f.val ? 'var(--blanc)' : 'var(--gris)' }}>
            {f.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(reviews ?? []).map((r: { id: string; rating: number; comment: string; author_name: string; status: string; created_at: string }) => (
          <div key={r.id} style={{ border: '1px solid var(--bordure)', padding: '24px', display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '8px' }}>{stars(r.rating)}</div>
              <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--noir)', lineHeight: 1.6, marginBottom: '10px' }}>
                &ldquo;{r.comment}&rdquo;
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--gris)', letterSpacing: '0.1em' }}>
                {r.author_name ?? 'Anonyme'} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <AdminReviewActions reviewId={r.id} currentStatus={r.status} />
          </div>
        ))}
        {(!reviews || reviews.length === 0) && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>
            Aucun avis dans cette catégorie.
          </p>
        )}
      </div>
    </div>
  );
}
