import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-server';
import AdminTabs from '@/components/Admin/AdminTabs';

interface OrderRow {
  id: string;
  subtotal?: number | null;
  shipping_cost?: number | null;
  total_price?: number | null;
  total?: number | null;
  status: string;
  created_at: string;
  customer_name?: string | null;
}

/**
 * Page /admin : un seul écran avec onglets (Dashboard, Produits, Commandes, Avis).
 * Les onglets changent l’état local (useState), pas de navigation vers /admin/products etc.
 * Données chargées côté serveur avec createAdminClient (pas de dépendance session Supabase).
 */
export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    redirect('/api/auth/sync-session?then=/admin');
  }
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== 'admin') {
    redirect('/api/auth/sync-session?then=/admin');
  }

  const admin = createAdminClient();

  const [
    { count: nbProducts },
    { count: nbOrders },
    { count: nbPending },
    { data: recentOrders },
    { data: products },
    { data: orders },
    { data: reviews },
  ] = await Promise.all([
    admin.from('products').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('*', { count: 'exact', head: true }),
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders').select('id, total, total_price, subtotal, shipping_cost, status, created_at, customer_name').order('created_at', { ascending: false }).limit(5),
    admin.from('products').select('id, image_url, name, category, price, stock').order('created_at', { ascending: false }),
    admin.from('orders').select('id, customer_name, customer_email, total, total_price, subtotal, shipping_cost, shipping_address, status, created_at, items').order('created_at', { ascending: false }),
    admin.from('reviews').select('id, rating, comment, author_name, status, created_at').order('created_at', { ascending: false }),
  ]);

  const dashboard = {
    nbProducts: nbProducts ?? 0,
    nbOrders: nbOrders ?? 0,
    nbPending: nbPending ?? 0,
    recentOrders: (recentOrders ?? []).map((o: OrderRow) => ({
      id: o.id,
      subtotal: o.subtotal ?? 0,
      shipping_cost: o.shipping_cost ?? 0,
      total: (o.total_price ?? o.total) ?? 0,
      status: o.status,
      created_at: o.created_at,
      customer_name: o.customer_name ?? null,
    })),
  };

  return (
    <AdminTabs
      dashboard={dashboard}
      products={products ?? []}
      orders={orders ?? []}
      reviews={reviews ?? []}
    />
  );
}
