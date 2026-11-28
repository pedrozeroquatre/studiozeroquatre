// La consultation VIES : l'appel, les réessais, et la lecture de la réponse.
//
// Sans dépendance à Next, pour que les tests (tests/verification-tva.test.mjs,
// `npm test`) l'exercent avec un faux VIES.
//
// ⚠ Même logique que Studio-ZeroQuatre-OS/supabase/functions/verifier-tva/vies.mjs,
// qui revérifie les numéros après coup. Les deux dépôts ne partagent pas de
// code : une correction ici se reporte là-bas.

const VIES = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/BE/vat/'

// VIES dépend des administrations nationales et tombe parfois. Ces réponses-là
// ne disent rien du numéro.
const INDISPONIBLE = /UNAVAILABLE|TIMEOUT|MAX_CONCURRENT|SERVICE|SERVER_BUSY/i

// Range une réponse VIES dans l'un des quatre cas qui comptent :
//   'valide'        le numéro est actif à la TVA
//   'non_assujetti' VIES ne le connaît pas (franchise de TVA, ou numéro faux)
//   'invalide'      VIES refuse le format
//   'indisponible'  VIES n'a pas pu répondre — rien à conclure
export function classerReponseVies(reponse) {
  if (reponse?.isValid === true) return 'valide'
  const erreur = String(reponse?.userError || '')
  if (INDISPONIBLE.test(erreur)) return 'indisponible'
  if (erreur === 'INVALID_INPUT') return 'invalide'
  if (reponse?.isValid === false) return 'non_assujetti'
  return 'indisponible'
}

// Rend { cas, reponse }. N'échoue jamais : panne réseau, délai dépassé ou page
// HTML à la place du JSON donnent 'indisponible'.
//
// La Belgique répond souvent MS_MAX_CONCURRENT_REQ puis redevient disponible
// quelques secondes plus tard : on réessaie avant de conclure.
export async function interrogerVies(chiffres, {
  fetch: f = globalThis.fetch,
  attendre = ms => new Promise(r => setTimeout(r, ms)),
  essais = 3,
  delai = 6000,
} = {}) {
  let derniere = { cas: 'indisponible', reponse: null }
  for (let essai = 1; essai <= essais; essai++) {
    try {
      const res = await f(VIES + chiffres, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(delai),
        cache: 'no-store',
      })
      const reponse = await res.json()
      const cas = classerReponseVies(reponse)
      derniere = { cas, reponse }
      if (cas !== 'indisponible') return derniere
    } catch (err) {
      derniere = { cas: 'indisponible', reponse: null, erreur: String(err?.message || err) }
    }
    if (essai < essais) await attendre(1500 * essai)
  }
  return derniere
}
