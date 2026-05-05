import { formatPrice } from '@/lib/utils';
import { sendResendEmail } from '@/lib/email/resend';
import { escapeHtml, orderEmailShell } from '@/lib/email/order-email-layout';
import { getPublicSiteUrl } from '@/lib/site-url';

type OrderItemRow = {
  product_name?: string;
  name?: string;
  price?: number;
  qty?: number;
};

export type OrderEmailRow = {
  id: string | number;
  customer_email: string;
  customer_name?: string | null;
  total_price?: number | null;
  total?: number | null;
  items?: OrderItemRow[] | Record<string, unknown>[] | null;
  notes?: string | null;
};

function itemsHtml(items: OrderEmailRow['items']): string {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p style="margin:0 0 16px 0"><em style="color:#6B6459">Détail des articles disponible dans votre espace.</em></p>`;
  }
  const rows = items.map((raw) => {
    const i = raw as OrderItemRow;
    const name = i.product_name ?? i.name ?? 'Article';
    const price = typeof i.price === 'number' ? i.price : 0;
    const qty = typeof i.qty === 'number' ? i.qty : 1;
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #1A2528;color:#E8E4DE">${escapeHtml(name)}</td><td style="padding:10px 0;border-bottom:1px solid #1A2528;text-align:right;color:#9A9288;font-size:14px">${qty} × ${formatPrice(price)}</td></tr>`;
  });
  return `<p style="margin:0 0 8px 0;font-weight:600;color:#E8E4DE;font-size:14px">Récapitulatif</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px">${rows.join('')}</table>`;
}

function orderRef(id: string | number): string {
  return String(id).length > 8 ? String(id).slice(0, 8) : String(id);
}

function greeting(nameFirst: string): string {
  return nameFirst ? `Bonjour ${nameFirst},` : 'Bonjour,';
}

/** Après paiement confirmé (page succès Stripe). */
export async function sendOrderConfirmationEmail(order: OrderEmailRow): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const total = order.total_price ?? order.total ?? 0;
  const base = getPublicSiteUrl();
  const ref = orderRef(order.id);
  const first = order.customer_name ? escapeHtml(order.customer_name.split(' ')[0] ?? '') : '';

  const inner = `
  <p style="margin:0 0 14px 0">${greeting(first)}</p>
  <p style="margin:0 0 14px 0">Nous avons bien enregistré votre commande <strong style="color:#E8E4DE">#${escapeHtml(ref)}</strong> et votre paiement.</p>
  <p style="margin:0 0 20px 0">Merci pour votre confiance — Elena prépare vos bijoux avec soin.</p>
  ${itemsHtml(order.items)}
  <p style="margin:16px 0 0 0;font-size:17px"><strong style="color:#8FD5D1">Total TTC : ${escapeHtml(formatPrice(Number(total)))}</strong></p>
  <p style="margin:22px 0 0 0;font-size:13px;color:#6B6459">Pour toute question : répondez à cet e-mail ou écrivez-nous depuis la page contact du site.</p>`;

  const html = orderEmailShell({
    siteBase: base,
    headline: 'Commande confirmée',
    innerHtml: inner,
    ...(base ? { cta: { href: base, label: 'Voir le site' } } : {}),
  });

  const r = await sendResendEmail({
    to: order.customer_email,
    subject: `Commande #${ref} confirmée — Heaven's By Elena`,
    html,
  });
  if (!r.ok) console.error('[order-emails] confirmation:', r.error);
}

/** Expédition — notes admin = numéro de suivi ou précision transporteur. */
export async function sendOrderShippedEmail(order: OrderEmailRow): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const base = getPublicSiteUrl();
  const ref = orderRef(order.id);
  const first = order.customer_name ? escapeHtml(order.customer_name.split(' ')[0] ?? '') : '';
  const notes = order.notes?.trim();
  const trackingBlock = notes
    ? `<div style="margin:18px 0;padding:16px 18px;background-color:#12110E;border:1px dashed #8FD5D1;border-radius:8px;font-size:14px;line-height:1.55;color:#E8E4DE">
        <strong style="color:#8FD5D1;display:block;margin-bottom:8px">Suivi de colis</strong>
        ${escapeHtml(notes).replace(/\n/g, '<br/>')}
      </div>`
    : `<p style="margin:16px 0;color:#9A9288">Votre colis est en route. Vous recevrez bientôt votre livraison.</p>`;

  const inner = `
  <p style="margin:0 0 14px 0">${greeting(first)}</p>
  <p style="margin:0 0 14px 0">Bonne nouvelle : votre commande <strong style="color:#E8E4DE">#${escapeHtml(ref)}</strong> a été expédiée.</p>
  ${trackingBlock}
  <p style="margin:18px 0 0 0;font-size:13px;color:#6B6459">Merci encore pour votre confiance.</p>`;

  const html = orderEmailShell({
    siteBase: base,
    headline: 'Votre colis est parti',
    innerHtml: inner,
    ...(base ? { cta: { href: `${base}/account/login`, label: 'Mon compte' } } : {}),
  });

  const r = await sendResendEmail({
    to: order.customer_email,
    subject: `Votre commande #${ref} a été expédiée — Heaven's By Elena`,
    html,
  });
  if (!r.ok) console.error('[order-emails] shipped:', r.error);
}

/** Livraison confirmée. */
export async function sendOrderDeliveredEmail(order: OrderEmailRow): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const base = getPublicSiteUrl();
  const ref = orderRef(order.id);
  const first = order.customer_name ? escapeHtml(order.customer_name.split(' ')[0] ?? '') : '';

  const inner = `
  <p style="margin:0 0 14px 0">${greeting(first)}</p>
  <p style="margin:0 0 14px 0">Votre commande <strong style="color:#E8E4DE">#${escapeHtml(ref)}</strong> est indiquée comme <strong style="color:#8FD5D1">livrée</strong>.</p>
  <p style="margin:0 0 14px 0">Nous espérons que vos bijoux vous enchantent. Un grand merci pour votre confiance.</p>`;

  const html = orderEmailShell({
    siteBase: base,
    headline: 'Livraison confirmée',
    innerHtml: inner,
    ...(base ? { cta: { href: `${base}/shop`, label: 'Découvrir la boutique' } } : {}),
  });

  const r = await sendResendEmail({
    to: order.customer_email,
    subject: `Commande #${ref} livrée — Heaven's By Elena`,
    html,
  });
  if (!r.ok) console.error('[order-emails] delivered:', r.error);
}
