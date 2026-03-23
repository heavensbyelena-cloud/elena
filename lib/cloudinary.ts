/**
 * Upload d'images vers Cloudinary (côté serveur).
 * Utilise fetch() au lieu du SDK Node.js pour compatibilité Cloudflare Workers.
 * Variables d'environnement : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
const FOLDER = 'heaven-products';

function getConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary: définir CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env.local'
    );
  }
  return { cloud_name, api_key, api_secret };
}

/**
 * Upload une image (buffer) vers Cloudinary via l'API REST (fetch).
 * Compatible avec Cloudflare Workers (pas de https.request Node.js).
 */
/** Encode buffer en base64 (compatible Cloudflare Workers, évite la limite d'arguments) */
function toBase64(buffer: Buffer | ArrayBuffer | Uint8Array): string {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(buffer)) {
    return (buffer as Buffer).toString('base64');
  }
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : (buffer as Uint8Array);
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < data.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(data.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

export async function uploadImage(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  mimeType: string = 'image/jpeg'
): Promise<{ url: string; public_id: string }> {
  const config = getConfig();
  const base64 = toBase64(buffer);

  const dataUri = `data:${mimeType};base64,${base64}`;

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('folder', FOLDER);
  formData.append('resource_type', 'image');

  const credentials = btoa(`${config.api_key}:${config.api_secret}`);
  const url = `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary: ${response.status} - ${errText || response.statusText}`);
  }

  const result = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
  };

  if (!result?.secure_url || !result?.public_id) {
    throw new Error('Cloudinary: réponse invalide');
  }

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}
