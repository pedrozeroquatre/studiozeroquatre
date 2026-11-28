// Tests de la vérification TVA de l'inscription, avec un faux VIES : aucun
// appel réseau.
//   npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normaliserTva, decouperAdresse } from '../lib/numero-tva.js'
import { classerReponseVies, interrogerVies } from '../lib/verification-tva.js'

// Numéro fictif dont la clé modulo 97 est juste : 97 − (04311882 mod 97) = 59.
const BON = '0431188259'

// Un faux fetch qui rend, appel après appel, les réponses données.
// Une réponse peut être un objet (JSON), une Error (panne réseau) ou 'html'.
function fauxVies(...reponses) {
  const appels = []
  const f = async url => {
    appels.push(url)
    const r = reponses[Math.min(appels.length - 1, reponses.length - 1)]
    if (r instanceof Error) throw r
    if (r === 'html') return { json: async () => { throw new SyntaxError('Unexpected token <') } }
    return { json: async () => r }
  }
  f.appels = appels
  return f
}
const sansAttente = { attendre: async () => {} }

// ——— Normalisation et clé modulo 97 ———

test('normalise les formes courantes', () => {
  for (const saisie of ['BE 0431.188.259', 'be0431188259', '431188259', 'BEBE 0431 188 259', ' BE-0431/188/259 ']) {
    assert.equal(normaliserTva(saisie), BON, saisie)
  }
})

test('refuse une mauvaise clé, un autre pays, une longueur fausse', () => {
  for (const saisie of ['BE 0431.188.258', 'FR0431188259', 'NL 0431188259', '', null, 'BE123', '2431188259']) {
    assert.equal(normaliserTva(saisie), null, String(saisie))
  }
})

// ——— Les trois cas ———

test('isValid=true → valide (pré-remplissage)', async () => {
  const f = fauxVies({ isValid: true, name: 'SRL EXEMPLE', address: 'Rue de l’Exemple 12\n1000 Bruxelles' })
  const r = await interrogerVies(BON, { fetch: f, ...sansAttente })
  assert.equal(r.cas, 'valide')
  assert.equal(f.appels.length, 1)
  assert.deepEqual(decouperAdresse(r.reponse.address), { rue: 'Rue de l’Exemple 12', cp: '1000', ville: 'Bruxelles' })
})

test('userError=INVALID → non assujetti, pas de réessai (saisie manuelle, pas de blocage)', async () => {
  const f = fauxVies({ isValid: false, userError: 'INVALID' })
  const r = await interrogerVies(BON, { fetch: f, ...sansAttente })
  assert.equal(r.cas, 'non_assujetti')
  assert.equal(f.appels.length, 1)
})

test('MS_UNAVAILABLE à chaque essai → indisponible après 3 appels', async () => {
  const f = fauxVies({ isValid: false, userError: 'MS_UNAVAILABLE' })
  const r = await interrogerVies(BON, { fetch: f, ...sansAttente })
  assert.equal(r.cas, 'indisponible')
  assert.equal(f.appels.length, 3)
})

test('MS_MAX_CONCURRENT_REQ puis valide : réessaie et conclut', async () => {
  const f = fauxVies({ isValid: false, userError: 'MS_MAX_CONCURRENT_REQ' }, { isValid: true })
  const r = await interrogerVies(BON, { fetch: f, ...sansAttente })
  assert.equal(r.cas, 'valide')
  assert.equal(f.appels.length, 2)
})

test('TIMEOUT, panne réseau, page HTML → indisponible, sans planter', async () => {
  for (const reponse of [{ isValid: false, userError: 'TIMEOUT' }, new Error('fetch failed'), 'html']) {
    const r = await interrogerVies(BON, { fetch: fauxVies(reponse), ...sansAttente })
    assert.equal(r.cas, 'indisponible', String(reponse?.userError || reponse))
  }
})

test('INVALID_INPUT → invalide ; réponse illisible → indisponible', () => {
  assert.equal(classerReponseVies({ isValid: false, userError: 'INVALID_INPUT' }), 'invalide')
  assert.equal(classerReponseVies(null), 'indisponible')
  assert.equal(classerReponseVies({}), 'indisponible')
})
