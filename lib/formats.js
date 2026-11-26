// Boîtes et sacs.
//
// Un sac est un format comme un autre — une ligne « Sac » dans
// `portail_mes_stocks` —, avec son propre prix : `portail_mon_tarif` rend
// `prix_unitaire_htva` (par boîte, tous formats confondus) et `prix_sac_htva`.
//
// Ce module est partagé par l'écran de commande ET la route de paiement : le
// montant affiché et le montant débité viennent de la même règle.
//
// Même reconnaissance que l'OS (estSac dans App.jsx) et que la base
// (supabase-sacs.sql) : une référence qui commence par le mot « sac ».

export const estSac = (reference) => /^\s*sac\b/i.test(String(reference ?? ''))

// Le prix HTVA d'un format, ou null s'il n'est pas enregistré. Jamais de
// repli de l'un sur l'autre : un sac payé au prix d'une boîte est une erreur
// de facturation, pas un défaut acceptable.
export function prixDuFormat(reference, { boite, sac } = {}) {
  const prix = Number(estSac(reference) ? sac : boite)
  return Number.isFinite(prix) && prix > 0 ? prix : null
}

// « 1 sac », « 2 000 boîtes ».
export function unite(reference, quantite) {
  const pluriel = Number(quantite) > 1
  return estSac(reference) ? (pluriel ? 'sacs' : 'sac') : (pluriel ? 'boîtes' : 'boîte')
}
