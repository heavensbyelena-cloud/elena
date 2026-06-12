import { createAdminClient } from '@/lib/supabase-server';
import type { Review } from '@/types';

export type PublicReview = Review & {
  product_name?: string | null;
};

export async function getLatestApprovedReviews(
  limit = 10
): Promise<{ reviews: PublicReview[]; average: number }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reviews')
      .select('id, rating, comment, author_name, created_at, product_id')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data ?? []) as Review[];
    const productIds = [
      ...new Set(
        rows
          .map((r) => r.product_id)
          .filter((id): id is string | number => id != null && id !== '')
          .map(String)
      ),
    ];

    const nameByProductId = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await admin
        .from('products')
        .select('id, name')
        .in('id', productIds);
      for (const p of products ?? []) {
        nameByProductId.set(String((p as { id: unknown }).id), (p as { name: string }).name);
      }
    }

    const reviews: PublicReview[] = rows.map((r) => ({
      ...r,
      product_name: r.product_id ? nameByProductId.get(String(r.product_id)) ?? null : null,
    }));

    const average = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { reviews, average };
  } catch {
    return { reviews: [], average: 0 };
  }
}
