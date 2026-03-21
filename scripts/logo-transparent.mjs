/**
 * Script pour rendre le fond du logo transparent.
 * Les pixels sombres (fond) deviennent transparents.
 */
import sharp from 'sharp';
import { unlinkSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const logoPath = join(projectRoot, 'public', 'logo.png');

// Seuil : pixels plus sombres que ça deviennent transparents (0-255)
const THRESHOLD = 45;

async function main() {
  const img = sharp(logoPath);
  const meta = await img.metadata();

  // Créer un masque : pixels sombres = noir (transparent), clairs = blanc (opaque)
  const mask = await sharp(logoPath)
    .grayscale()
    .threshold(THRESHOLD)
    .toBuffer();

  // Appliquer le masque comme canal alpha (écrire dans un fichier temporaire)
  const tempPath = join(projectRoot, 'public', 'logo-new.png');
  await sharp(logoPath)
    .ensureAlpha()
    .joinChannel(mask)
    .toFile(tempPath);

  unlinkSync(logoPath);
  renameSync(tempPath, logoPath);

  console.log('Logo mis à jour avec fond transparent.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
