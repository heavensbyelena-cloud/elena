/**
 * Enveloppe HTML des e-mails commande (charte alignée sur supabase/email-templates/confirm-signup.html).
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const sans = "Arial,Helvetica,sans-serif";
const serif = "Georgia,'Times New Roman',serif";

export type OrderEmailShellOptions = {
  /** URL du site sans slash final (vide = pas de logo). */
  siteBase: string;
  headline: string;
  /** Bloc principal (HTML sûr, construit côté serveur uniquement). */
  innerHtml: string;
  /** Lien CTA optionnel sous le corps */
  cta?: { href: string; label: string };
  /** Ligne fine sous le CTA (ex. lien brut) */
  footerHint?: string;
};

export function orderEmailShell(opts: OrderEmailShellOptions): string {
  const safeHeadline = escapeHtml(opts.headline);
  const base = opts.siteBase.trim();
  const logoRow =
    base.length > 0
      ? `<tr>
            <td align="center" style="padding:28px 24px 8px 24px;">
              <img src="${escapeHtml(`${base}/email-logo.png`)}" alt="Heaven's By Elena" width="280" style="display:block;max-width:100%;height:auto;border:0;" />
            </td>
          </tr>`
      : '';
  const headlinePad = base.length > 0 ? '8px 32px 8px 32px' : '28px 32px 8px 32px';

  const ctaBlock = opts.cta
    ? `<tr>
              <td align="center" style="padding:8px 24px 24px 24px;">
                <a href="${escapeHtml(opts.cta.href)}" style="display:inline-block;padding:14px 36px;background-color:#8FD5D1;color:#060606;text-decoration:none;font-family:${sans};font-size:15px;font-weight:600;border-radius:8px;">
                  ${escapeHtml(opts.cta.label)}
                </a>
              </td>
            </tr>`
    : '';

  const hintBlock = opts.footerHint
    ? `<tr>
              <td style="padding:0 32px 28px 32px;font-size:12px;line-height:1.55;color:#6B6459;text-align:center;font-family:${sans};">
                ${opts.footerHint}
              </td>
            </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeHeadline}</title>
</head>
<body style="margin:0;padding:0;background-color:#060606;color:#E8E4DE;font-family:${serif};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#060606;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#0E0D0B;border:1px solid #1A2528;border-radius:12px;overflow:hidden;">
          ${logoRow}
          <tr>
            <td style="padding:${headlinePad};font-size:22px;line-height:1.35;text-align:center;color:#E8E4DE;font-weight:400;">
              ${safeHeadline}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;font-size:15px;line-height:1.65;color:#9A9288;font-family:${sans};">
              ${opts.innerHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:0 32px 32px 32px;border-top:1px solid #1A2528;font-size:12px;line-height:1.6;color:#6B6459;text-align:center;font-family:${sans};">
              Elena — Heaven's By Elena
            </td>
          </tr>
          ${hintBlock}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
