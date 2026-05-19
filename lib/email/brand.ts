/**
 * Logo affiché dans les e-mails (confirmation Supabase, commandes Resend).
 * Par défaut : hébergement GitHub (HTTPS public) — les PNG du site Cloudflare
 * peuvent renvoyer 500 tant que les assets statiques ne sont pas servis correctement.
 *
 * Optionnel : EMAIL_LOGO_URL ou NEXT_PUBLIC_EMAIL_LOGO_URL (ex. URL Cloudinary).
 */
export const EMAIL_LOGO_URL_DEFAULT =
  'https://raw.githubusercontent.com/heavensbyelena-cloud/elena/main/public/email-logo.png';

export function getEmailLogoUrl(): string {
  const fromEnv =
    process.env.EMAIL_LOGO_URL?.trim() ||
    process.env.NEXT_PUBLIC_EMAIL_LOGO_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return EMAIL_LOGO_URL_DEFAULT;
}
