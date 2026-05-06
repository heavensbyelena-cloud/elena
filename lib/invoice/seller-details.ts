/**
 * Mentions vendeur sur les factures / reçus PDF — surcharges possibles via variables d'environnement.
 */

export type SellerDetails = {
  tradeName: string;
  siret: string;
  email: string;
  phone: string;
  /** Adresse du siège ou de l'établissement — définir INVOICE_SELLER_ADDRESS dans .env / Cloudflare si besoin */
  legalAddress: string;
  vatDisclaimer: string;
};

export function getSellerDetails(): SellerDetails {
  return {
    tradeName: process.env.INVOICE_SELLER_NAME?.trim() ?? "Heaven's By Elena",
    siret: process.env.INVOICE_SELLER_SIRET?.trim() ?? '99225303900018',
    email: process.env.INVOICE_SELLER_EMAIL?.trim() ?? 'Heavensbyelena@gmail.com',
    phone: process.env.INVOICE_SELLER_PHONE?.trim() ?? '07 75 76 45 21',
    legalAddress:
      process.env.INVOICE_SELLER_ADDRESS?.trim() ?? '255 rue de la laiterie\n60490 Ressons-sur-Matz',
    vatDisclaimer:
      process.env.INVOICE_VAT_DISCLAIMER?.trim() ?? 'TVA non applicable, art. 293 B du CGI.',
  };
}
