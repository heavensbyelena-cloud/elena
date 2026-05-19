import type { SupabaseClient } from '@supabase/supabase-js';

type DbError = { message?: string; code?: string };

/** Colonne `images` absente si la migration Supabase n'a pas encore été appliquée. */
export function isMissingImagesColumn(error: DbError | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    error.code === 'PGRST204' ||
    (msg.includes('images') && (msg.includes('column') || msg.includes('schema cache')))
  );
}

type ProductWritePayload = Record<string, unknown> & {
  image_url?: string | null;
  images?: string[] | null;
};

export async function insertProductRow(
  admin: SupabaseClient,
  payload: ProductWritePayload
) {
  let result = await admin.from('products').insert([payload]).select().single();
  if (result.error && isMissingImagesColumn(result.error) && 'images' in payload) {
    const { images: _removed, ...withoutImages } = payload;
    result = await admin.from('products').insert([withoutImages]).select().single();
  }
  return result;
}

export async function updateProductRow(
  admin: SupabaseClient,
  id: string,
  payload: ProductWritePayload
) {
  let result = await admin.from('products').update(payload).eq('id', id).select().single();
  if (result.error && isMissingImagesColumn(result.error) && 'images' in payload) {
    const { images: _removed, ...withoutImages } = payload;
    result = await admin.from('products').update(withoutImages).eq('id', id).select().single();
  }
  return result;
}
