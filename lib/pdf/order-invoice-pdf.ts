import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatPrice } from '@/lib/utils';
import { getSellerDetails, type SellerDetails } from '@/lib/invoice/seller-details';

type ShipAddr = {
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

function orderRef(id: string | number): string {
  return String(id).length > 8 ? String(id).slice(0, 8) : String(id);
}

function wrapLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? `${w.slice(0, maxChars - 1)}…` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function formatShipping(addr: ShipAddr | null | undefined): string[] {
  if (!addr || typeof addr !== 'object') return [];
  const name = `${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim();
  const lines: string[] = [];
  if (name) lines.push(name);
  if (addr.address) lines.push(addr.address);
  const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  if (addr.phone) lines.push(`Tél. : ${addr.phone}`);
  return lines;
}

type LineItem = { name: string; qty: number; unit: number; lineTotal: number };

type OrderItems = Array<Record<string, unknown>> | null | undefined;

function parseItems(items: OrderItems): LineItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((raw) => {
    const i = raw as { product_name?: string; name?: string; price?: number; qty?: number };
    const name = i.product_name ?? i.name ?? 'Article';
    const unit = typeof i.price === 'number' ? i.price : 0;
    const qty = typeof i.qty === 'number' ? i.qty : 1;
    return { name, qty, unit, lineTotal: unit * qty };
  });
}

export type OrderInvoicePdfInput = {
  id: string | number;
  customer_email: string;
  customer_name?: string | null;
  total_price?: number | null;
  total?: number | null;
  items?: OrderItems;
  shipping_address?: ShipAddr | Record<string, unknown> | null;
  subtotal?: number | null;
  shipping_cost?: number | null;
  discount_amount?: number | null;
  created_at?: string | null;
};

function pdfDate(iso?: string | null): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return new Date().toLocaleDateString('fr-FR');
  }
}

/**
 * Génère un PDF facture / reçu (micro-entrepreneur, hors TVA) — compatible fetch / Workers.
 */
export async function buildOrderInvoicePdf(order: OrderInvoicePdfInput): Promise<Uint8Array> {
  const seller = getSellerDetails();
  const doc = await PDFDocument.create();
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 48;
  let page = doc.addPage([pageW, pageH]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.07, 0.07, 0.07);
  const muted = rgb(0.35, 0.35, 0.35);

  let y = pageH - margin;

  const drawLeft = (t: string, size: number, bold = false, color = black) => {
    const f = bold ? fontBold : font;
    page.drawText(t, { x: margin, y, size, font: f, color });
    y -= size + (bold ? 6 : 4);
  };

  const invoiceNo = `FAC-${orderRef(order.id)}`;

  drawLeft('Facture', 18, true);
  drawLeft(`N° ${invoiceNo}`, 11, true);
  drawLeft(`Date : ${pdfDate(order.created_at)}`, 10, false, muted);
  y -= 8;

  drawLeft('Vendeur', 11, true);
  sellerBlock(seller, drawLeft);

  y -= 8;
  drawLeft('Client', 11, true);
  const custName = order.customer_name?.trim() || 'Client';
  drawLeft(custName, 10);
  drawLeft(order.customer_email, 10, false, muted);

  const shipLines = formatShipping(order.shipping_address as ShipAddr);
  if (shipLines.length) {
    drawLeft('Adresse de livraison', 10, true, muted);
    for (const line of shipLines) {
      wrapLine(line, 70).forEach((ln) => drawLeft(ln, 10));
    }
  }

  y -= 10;
  drawLeft('Détail', 11, true);

  const items = parseItems(order.items);
  const colDesc = margin;
  const colQty = pageW - margin - 200;
  const colUnit = pageW - margin - 130;
  const colTot = pageW - margin - 55;

  page.drawText('Désignation', { x: colDesc, y, size: 9, font: fontBold, color: muted });
  page.drawText('Qté', { x: colQty, y, size: 9, font: fontBold, color: muted });
  page.drawText('P.U.', { x: colUnit, y, size: 9, font: fontBold, color: muted });
  page.drawText('Montant', { x: colTot, y, size: 9, font: fontBold, color: muted });
  y -= 14;

  if (items.length === 0) {
    drawLeft('(Détail des articles sur votre commande en ligne)', 10, false, muted);
  } else {
    for (const row of items) {
      const nameLines = wrapLine(row.name, 48);
      for (let li = 0; li < nameLines.length; li++) {
        const ln = nameLines[li];
        page.drawText(ln, { x: colDesc, y, size: 9, font: li === 0 ? fontBold : font, color: black });
        if (li === 0) {
          page.drawText(String(row.qty), { x: colQty, y, size: 9, font, color: black });
          page.drawText(formatPrice(row.unit), { x: colUnit, y, size: 9, font, color: black });
          page.drawText(formatPrice(row.lineTotal), { x: colTot, y, size: 9, font, color: black });
        }
        y -= 12;
        if (y < margin + 120) {
          page = doc.addPage([pageW, pageH]);
          y = pageH - margin;
        }
      }
    }
  }

  y -= 6;
  if (y < margin + 140) {
    page = doc.addPage([pageW, pageH]);
    y = pageH - margin;
  }

  const sub = order.subtotal;
  const ship = order.shipping_cost;
  const disc = order.discount_amount;
  const total = Number(order.total_price ?? order.total ?? 0);

  const drawEuroRow = (label: string, value: number) => {
    page.drawText(label, { x: colUnit - 40, y, size: 10, font: fontBold, color: black });
    page.drawText(formatPrice(value), { x: colTot, y, size: 10, font: fontBold, color: black });
    y -= 14;
  };

  if (typeof sub === 'number' && !Number.isNaN(sub)) {
    drawEuroRow('Sous-total', sub);
  }
  if (typeof ship === 'number' && ship > 0) {
    drawEuroRow('Frais de port', ship);
  }
  if (typeof disc === 'number' && disc > 0) {
    page.drawText('Réduction', { x: colUnit - 40, y, size: 10, font: fontBold, color: black });
    page.drawText(`− ${formatPrice(disc)}`, { x: colTot, y, size: 10, font: fontBold, color: black });
    y -= 14;
  }

  drawEuroRow('Total dû', total);

  y -= 16;
  page.drawText('Paiement : carte bancaire (internet).', {
    x: margin,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 14;

  const vatLines = wrapLine(seller.vatDisclaimer, 85);
  for (const vl of vatLines) {
    page.drawText(vl, { x: margin, y, size: 9, font: fontBold, color: black });
    y -= 12;
    if (y < margin + 60) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

function sellerBlock(seller: SellerDetails, drawLeft: (t: string, s: number, b?: boolean, c?: ReturnType<typeof rgb>) => void) {
  drawLeft(seller.tradeName, 10);
  if (seller.legalAddress) {
    seller.legalAddress.split(/\r?\n/).forEach((line) => {
      if (line.trim()) drawLeft(line.trim(), 10);
    });
  }
  drawLeft(`SIRET : ${seller.siret}`, 10, false, rgb(0.35, 0.35, 0.35));
  drawLeft(seller.email, 10, false, rgb(0.35, 0.35, 0.35));
  drawLeft(seller.phone, 10, false, rgb(0.35, 0.35, 0.35));
}
