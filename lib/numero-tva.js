// Numéro de TVA belge et réponse de VIES.
//
// Utilisé des deux côtés : le navigateur pour prévenir une faute de frappe
// avant tout appel, la route /api/espace/tva avant d'interroger VIES. La base
// refait le même contrôle dans `enregistrer_facturation()` — c'est elle qui
// fait foi, ceci n'est que du confort.

// « BE 0431.188.259 », « be0431188259 », « 431188259 » → '0431188259', ou null.
// Les anciens numéros à 9 chiffres prennent un 0 devant, comme le fait la BCE.
export function normaliserTva(saisie) {
  let chiffres = String(saisie || '').toUpperCase().replace(/[^0-9]/g, '')
  if (chiffres.length === 9) chiffres = '0' + chiffres
  if (!/^[01]\d{9}$/.test(chiffres)) return null

  // Clé de contrôle : les deux derniers chiffres valent 97 − (les huit premiers mod 97).
  const cle = 97 - (Number(chiffres.slice(0, 8)) % 97)
  return cle === Number(chiffres.slice(8)) ? chiffres : null
}

// '0431188259' → 'BE 0431.188.259', la forme imprimée sur les factures.
export function formaterTva(chiffres) {
  const c = normaliserTva(chiffres)
  if (!c) return chiffres || ''
  return `BE ${c.slice(0, 4)}.${c.slice(4, 7)}.${c.slice(7)}`
}

// VIES rend l'adresse belge en un bloc : « Rue de l'Abbaye 40\n1050 Ixelles ».
// La dernière ligne porte le code postal et la ville, le reste est la rue.
// Une forme inattendue rend null : l'espace passe alors en saisie manuelle
// plutôt que d'enregistrer une adresse mal découpée.
export function decouperAdresse(bloc) {
  const lignes = String(bloc || '').split('\n').map(l => l.trim()).filter(Boolean)
  if (lignes.length < 2) return null

  const m = lignes[lignes.length - 1].match(/^(\d{4})\s+(.+)$/)
  if (!m) return null

  return { rue: lignes.slice(0, -1).join(', '), cp: m[1], ville: m[2] }
}
