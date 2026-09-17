// La TVA de l'espace client.
//
// Côté base, tout est HTVA : `clients.prix`, `livraisons.prix_htva`,
// `commandes_clients.montant_htva`. C'est la bonne assiette pour la
// comptabilité et pour l'OS, et ça ne change pas.
//
// Mais le restaurateur, lui, ne raisonne pas en HTVA : il veut lire ce qu'il
// va réellement payer. Tout ce que l'espace AFFICHE est donc TTC, le HTVA
// restant écrit à côté, en petit, pour qu'il retrouve sa facture.
//
// Taux belge standard sur les emballages. C'est aussi le défaut de
// `livraisons.tva_taux` côté base : les deux doivent rester d'accord.
export const TVA_TAUX = 21

// Stripe calcule la TVA ligne par ligne et arrondit chaque ligne au centime.
// On refait exactement le même calcul — arrondir le total d'un coup donnerait
// parfois un centime d'écart entre le montant annoncé et le montant débité.
export function tvaSur(montantHtva, taux = TVA_TAUX) {
  const cents = Math.round(Number(montantHtva) * 100)
  const t = Number(taux)
  if (!Number.isFinite(cents) || !Number.isFinite(t)) return NaN
  return Math.round((cents * t) / 100) / 100
}

// Un taux absent (livraison ancienne, colonne à NULL) retombe sur le taux
// standard plutôt que d'afficher un montant faux.
export function avecTva(montantHtva, taux) {
  const t = taux == null ? TVA_TAUX : taux
  return Math.round(Number(montantHtva) * 100) / 100 + tvaSur(montantHtva, t)
}

// Le prix unitaire n'est pas un montant facturé : il garde ses décimales
// (numeric(10,4) en base), on ne l'arrondit donc pas au centime.
export function prixUnitaireTtc(prixHtva, taux = TVA_TAUX) {
  const p = Number(prixHtva)
  if (!Number.isFinite(p)) return NaN
  return Math.round(p * (1 + Number(taux) / 100) * 10000) / 10000
}

// Additionne des montants déjà arrondis au centime sans traîner de poussière
// de flottant.
export function somme(montants) {
  return Math.round(montants.reduce((s, m) => s + Math.round(m * 100), 0)) / 100
}
