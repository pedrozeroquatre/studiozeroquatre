import { NextResponse } from 'next/server'
import { supabasePourJeton } from '@/lib/supabase-jeton'
import { normaliserTva, decouperAdresse } from '@/lib/numero-tva'

// Consultation VIES pour la fiche de facturation de l'espace client.
//
// Le client tape son numéro de TVA ; on demande à VIES (le registre TVA de la
// Commission européenne) la raison sociale et l'adresse officielles, et on les
// lui rend découpées pour qu'il confirme. Rien n'est écrit ici : l'écriture
// passe par `enregistrer_facturation()`, depuis le navigateur.
//
// Pourquoi côté serveur : VIES n'autorise pas les appels depuis un navigateur
// (pas de CORS). Et la route exige une session client — sans ça, elle serait
// un relais VIES ouvert à n'importe qui sur Internet.

const VIES = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/BE/vat/'

// VIES dépend des administrations nationales et tombe parfois. Ces réponses-là
// ne disent rien du numéro. La Belgique, surtout, répond souvent
// MS_MAX_CONCURRENT_REQ (trop d'appels simultanés, tous pays confondus) puis
// redevient disponible quelques secondes plus tard : on réessaie avant de
// renvoyer le client vers la saisie manuelle.
const INDISPONIBLE = /UNAVAILABLE|TIMEOUT|MAX_CONCURRENT|SERVICE/i
const ESSAIS = 3

// Les essais peuvent prendre une quinzaine de secondes au pire.
export const maxDuration = 30

async function interrogerVies(chiffres) {
  for (let essai = 1; ; essai++) {
    const res = await fetch(VIES + chiffres, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    const reponse = await res.json()
    if (reponse?.isValid || !INDISPONIBLE.test(reponse?.userError || '') || essai >= ESSAIS) {
      return reponse
    }
    await new Promise(r => setTimeout(r, 1500 * essai))
  }
}

export async function POST(request) {
  const { jeton, tva } = await request.json().catch(() => ({}))

  if (!jeton) {
    return NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 })
  }

  const sb = supabasePourJeton(jeton)
  if (!sb) {
    return NextResponse.json({ error: 'Espace non configuré.' }, { status: 503 })
  }
  const { data: clientId } = await sb.rpc('mon_client_id')
  if (!clientId) {
    return NextResponse.json({ error: 'Compte non reconnu.' }, { status: 403 })
  }

  const chiffres = normaliserTva(tva)
  if (!chiffres) {
    return NextResponse.json({ statut: 'invalide' })
  }

  let reponse
  try {
    reponse = await interrogerVies(chiffres)
  } catch (err) {
    console.error('[espace/tva] VIES', err)
    return NextResponse.json({ statut: 'indisponible', tva: chiffres })
  }

  if (!reponse?.isValid) {
    const indisponible = INDISPONIBLE.test(reponse?.userError || '')
    return NextResponse.json({ statut: indisponible ? 'indisponible' : 'inconnu', tva: chiffres })
  }

  // VIES masque parfois le nom ou l'adresse (« --- »). Le numéro est bon, mais
  // il faudra compléter à la main.
  const nom = reponse.name && reponse.name !== '---' ? reponse.name.trim() : ''
  const adresse = decouperAdresse(reponse.address)

  return NextResponse.json({
    statut: nom && adresse ? 'trouve' : 'incomplet',
    tva: chiffres,
    societe: nom,
    rue: adresse?.rue ?? '',
    cp: adresse?.cp ?? '',
    ville: adresse?.ville ?? '',
  })
}
