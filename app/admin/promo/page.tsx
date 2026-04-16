import { requireAdmin } from '@/lib/auth';
import AdminPromoClient from './AdminPromoClient';

export default async function AdminPromoPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-10 md:py-16">
      <AdminPromoClient />
    </div>
  );
}
