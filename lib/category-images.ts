import { createAdminClient } from '@/lib/supabase-server';
import { applyCategoryImageOverrides, type CategoryDef } from '@/lib/categories';

export type CategoryImageOverrides = Record<string, string>;

export async function fetchCategoryImageOverrides(): Promise<CategoryImageOverrides> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('category_images').select('slug, image_url');
    if (error || !data) return {};
    return Object.fromEntries(data.map((row) => [row.slug, row.image_url]));
  } catch {
    return {};
  }
}

export async function getCategoriesWithImages(): Promise<CategoryDef[]> {
  const overrides = await fetchCategoryImageOverrides();
  return applyCategoryImageOverrides(overrides);
}
