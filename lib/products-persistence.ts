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

export type ProductWriteMeta = {
  imagesStripped?: boolean;
  materialsStripped?: boolean;
};

export type ProductWriteResult = {
  data: Record<string, unknown> | null;
  error: DbError | null;
  meta: ProductWriteMeta;
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
): Promise<ProductWriteResult> {
  const meta: ProductWriteMeta = {};
  let result = await admin.from('products').insert([payload]).select().single();
  if (result.error) {
    const stripImages = isMissingImagesColumn(result.error) && 'images' in payload;
    const stripMaterials = isMissingMaterialsColumn(result.error) && 'materials' in payload;
    if (stripImages || stripMaterials) {
      if (stripImages) meta.imagesStripped = true;
      if (stripMaterials) meta.materialsStripped = true;
      result = await admin
        .from('products')
        .insert([stripOptionalColumns(payload, stripImages, stripMaterials)])
        .select()
        .single();
    }
  }
  return { data: result.data as Record<string, unknown> | null, error: result.error, meta };
}

export async function updateProductRow(
  admin: SupabaseClient,
  id: string,
  payload: ProductWritePayload
): Promise<ProductWriteResult> {
  const meta: ProductWriteMeta = {};
  let result = await admin.from('products').update(payload).eq('id', id).select().single();
  if (result.error) {
    const stripImages = isMissingImagesColumn(result.error) && 'images' in payload;
    const stripMaterials = isMissingMaterialsColumn(result.error) && 'materials' in payload;
    if (stripImages || stripMaterials) {
      if (stripImages) meta.imagesStripped = true;
      if (stripMaterials) meta.materialsStripped = true;
      result = await admin
        .from('products')
        .update(stripOptionalColumns(payload, stripImages, stripMaterials))
        .eq('id', id)
        .select()
        .single();
    }
  }
  return { data: result.data as Record<string, unknown> | null, error: result.error, meta };
}

export function galleryMigrationWarning(
  meta: ProductWriteMeta,
  requestedImageCount: number
): string | null {
  if (!meta.imagesStripped || requestedImageCount <= 1) return null;
  return (
    'Seules la première photo a été enregistrée. Pour afficher jusqu’à 3 photos, exécutez la migration Supabase ' +
    '« products_images_array » (colonne images), puis ré-enregistrez le produit.'
  );
}
