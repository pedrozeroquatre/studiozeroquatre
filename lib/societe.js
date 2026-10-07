// Identité légale du studio — une seule source pour les mentions légales, la
// politique de confidentialité et les CGV. Ces valeurs ne s'inventent pas :
// elles viennent de la société (BCE) et se corrigent ici, nulle part ailleurs.
export const SOCIETE = {
  denomination: 'Studio Zeroquatre SRL',
  nom: 'Studio Zeroquatre',
  forme: 'société à responsabilité limitée (SRL)',
  siege: 'Rue de l’Abbaye 40, 1050 Ixelles, Belgique',
  bce: '1038.659.469',
  tva: 'BE 1038.659.469',
  responsable: 'Pedro Fernando Albuquerque Fatouros',
  email: 'contact@studiozeroquatre.com',
  telephone: '+32 471 34 54 34',
  telephoneHref: 'tel:+32471345434',
  site: 'www.studiozeroquatre.com',
}

// Version des CGV en vigueur. Elle est enregistrée avec chaque paiement de
// l'espace client (métadonnées Stripe) : c'est ce qui permet de dire, plus
// tard, QUELLE version un client a acceptée. À changer à chaque modification
// du texte des CGV — jamais sans.
export const CGV_VERSION = '2026-09-30'
export const CGV_VERSION_LIBELLE = '30 septembre 2026'
