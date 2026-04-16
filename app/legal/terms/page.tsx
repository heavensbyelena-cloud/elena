import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conditions générales de vente' };

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 40px' }}>
      <h1 className="section-title" style={{ marginBottom: '50px', textAlign: 'left' }}>Conditions générales de vente</h1>
      {[
        {
          title: '1. Identification du vendeur',
          text: "Heaven's By Elena – Vente en ligne de bijoux et articles de décoration. Site internet : www.heavensbyelena.com – Email : Heavensbyelena@gmail.com – Téléphone : 07 75 76 45 21 – SIRET : 99225303900018",
        },
        {
          title: '2. Objet',
          text: "Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre Heaven's By Elena, ci-après dénommée « le Vendeur », et toute personne physique effectuant un achat sur le site internet, ci-après dénommée « le Client ». Tout achat sur le site implique l'acceptation pleine et entière des présentes CGV. Le Client reconnaît en avoir pris connaissance avant de valider sa commande.",
        },
        {
          title: '3. Produits',
          text: "Les produits proposés à la vente sont des bijoux et articles de décoration décrits et présentés sur le site internet de Heaven's By Elena. Les photographies et descriptions sont aussi fidèles que possible, mais ne sont pas contractuelles. Le Vendeur se réserve le droit de modifier le catalogue à tout moment.",
        },
        {
          title: '4. Prix',
          text: "Les prix sont indiqués en euros (€), toutes taxes comprises (TTC). Heaven's By Elena se réserve le droit de modifier ses prix à tout moment. Les produits sont facturés au tarif en vigueur au moment de la validation de la commande. Les frais de livraison sont indiqués séparément avant la validation finale de la commande.",
        },
        {
          title: '5. Commande',
          text: "Le Client sélectionne les produits souhaités et les ajoute à son panier. Avant de valider sa commande, il vérifie son récapitulatif (produits, quantités, prix, adresse de livraison). La commande est définitivement validée après confirmation du paiement. Un email de confirmation est adressé au Client dans les meilleurs délais. Heaven's By Elena se réserve le droit de refuser ou d'annuler toute commande en cas de litige antérieur, de suspicion de fraude ou de rupture de stock.",
        },
        {
          title: '6. Paiement',
          text: "Le paiement s'effectue en ligne, de manière sécurisée, par les moyens suivants : carte bancaire, PayPal, ou tout autre moyen proposé sur le site. Le débit est effectué au moment de la validation de la commande. Les données bancaires du Client sont traitées par un prestataire de paiement sécurisé et ne sont pas conservées par Heaven's By Elena.",
        },
        {
          title: '7. Livraison',
          text: "Les commandes sont expédiées à l'adresse indiquée par le Client lors de sa commande. Les délais de livraison sont indiqués à titre indicatif lors de la commande. En cas de retard, Heaven's By Elena ne pourra être tenue responsable si ce retard est dû à un transporteur ou à un cas de force majeure. En cas de colis endommagé ou perdu, le Client doit contacter Heaven's By Elena dans un délai de 14 jours suivant la date de livraison estimée à l'adresse Heavensbyelena@gmail.com. Les frais de livraison sont à la charge du Client, sauf mention contraire.",
        },
        {
          title: '8. Droit de rétractation',
          text: "Conformément aux articles L.221-18 et suivants du Code de la consommation, le Client dispose d'un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à justifier de motif. Pour exercer ce droit, le Client doit notifier sa décision par email à Heavensbyelena@gmail.com en indiquant son numéro de commande. Il dispose ensuite de 14 jours pour renvoyer le produit dans son état d'origine, non utilisé et dans son emballage d'origine. Les frais de retour sont à la charge du Client. Le remboursement sera effectué dans un délai de 14 jours suivant la réception du retour, par le même moyen de paiement. Exception : le droit de rétractation ne s'applique pas aux bijoux personnalisés ou aux articles confectionnés sur mesure.",
        },
        {
          title: '9. Garanties',
          text: "Les produits vendus par Heaven's By Elena bénéficient de la garantie légale de conformité (articles L.217-4 et suivants du Code de la consommation) et de la garantie légale contre les vices cachés (articles 1641 et suivants du Code civil). En cas de défaut constaté, le Client doit contacter Heaven's By Elena par email à Heavensbyelena@gmail.com en fournissant une description du problème et des photos si nécessaire.",
        },
        {
          title: '10. Responsabilité',
          text: "Heaven's By Elena ne saurait être tenue responsable des dommages indirects résultant de l'utilisation des produits achetés. La responsabilité du Vendeur est limitée au montant de la commande concernée.",
        },
        {
          title: '11. Protection des données personnelles',
          text: "Les données personnelles collectées lors de la commande (nom, adresse, email, etc.) sont utilisées uniquement dans le cadre du traitement des commandes et de la relation commerciale. Conformément au RGPD, le Client dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données, en contactant Heaven's By Elena à Heavensbyelena@gmail.com.",
        },
        {
          title: '12. Propriété intellectuelle',
          text: "L'ensemble du contenu du site de Heaven's By Elena (textes, photos, visuels, logos) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.",
        },
        {
          title: '13. Médiation et litiges',
          text: "Conformément aux articles L.611-1 et suivants du Code de la consommation, le Client peut recourir gratuitement à un médiateur de la consommation en cas de litige non résolu à l'amiable, via la plateforme européenne : https://ec.europa.eu/consumers/odr. À défaut de résolution amiable, tout litige sera porté devant les tribunaux compétents du ressort du domicile du Client, conformément à la législation française en vigueur.",
        },
        {
          title: '14. Droit applicable',
          text: "Les présentes CGV sont soumises au droit français. Les CGV applicables sont celles en vigueur au jour de la commande. Heaven's By Elena se réserve le droit de les modifier à tout moment.",
        },
      ].map(s => (
        <section key={s.title} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '12px' }}>{s.title}</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--gris)', lineHeight: 1.8 }}>{s.text}</p>
        </section>
      ))}
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginTop: '40px' }}>Dernière mise à jour : mars 2026</p>
    </div>
  );
}
