import type { SupabaseClient } from '@supabase/supabase-js';

type DbError = { message?: string; code?: string };

/** Colonne absente si la migration Supabase n'a pas encore été appliquée. */
function isMissingColumn(error: DbError | null, column: string): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    error.code === 'PGRST204' ||
    (msg.includes(column) && (msg.includes('column') || msg.includes('schema cache')))
  );
}

export function isMissingImagesColumn(error: DbError | null): boolean {
  return isMissingColumn(error, 'images');
}

export function isMissingMaterialsColumn(error: DbError | null): boolean {
  return isMissingColumn(error, 'materials');
}

type ProductWritePayload = Record<string, unknown> & {
  image_url?: string | null;
  images?: string[] | null;
};

function stripOptionalColumns(
  payload: ProductWritePayload,
  stripImages: boolean,
  stripMaterials: boolean
): ProductWritePayload {
  let next = { ...payload };
  if (stripImages && 'images' in next) {
    const { images: _i, ...rest } = next;
    next = rest;
  }
  if (stripMaterials && 'materials' in next) {
    const { materials: _m, ...rest } = next;
    next = rest;
  }
  return next;
}

export async function insertProductRow(
  admin: SupabaseClient,
  payload: ProductWritePayload
) {
  let result = await admin.from('products').insert([payload]).select().single();
  if (result.error) {
    const stripImages = isMissingImagesColumn(result.error) && 'images' in payload;
    const stripMaterials = isMissingMaterialsColumn(result.error) && 'materials' in payload;
    if (stripImages || stripMaterials) {
      result = await admin
        .from('products')
        .insert([stripOptionalColumns(payload, stripImages, stripMaterials)])
        .select()
        .single();
    }
  }
  return result;
}

export async function updateProductRow(
  admin: SupabaseClient,
  id: string,
  payload: ProductWritePayload
) {
  let result = await admin.from('products').update(payload).eq('id', id).select().single();
  if (result.error) {
    const stripImages = isMissingImagesColumn(result.error) && 'images' in payload;
    const stripMaterials = isMissingMaterialsColumn(result.error) && 'materials' in payload;
    if (stripImages || stripMaterials) {
      result = await admin
        .from('products')
        .update(stripOptionalColumns(payload, stripImages, stripMaterials))
        .eq('id', id)
        .select()
        .single();
    }
  }
  return result;
}
