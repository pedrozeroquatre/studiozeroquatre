import { NextResponse } from 'next/server'
import { supabasePourJeton } from '@/lib/supabase-jeton'
import { normaliserTva, decouperAdresse } from '@/lib/numero-tva'
import { interrogerVies } from '@/lib/verification-tva'

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

// VIES ne bloque jamais le client. Ce qu'il ne confirme pas ici (numéro inconnu,
// typiquement une société en franchise de TVA, ou service en panne), le client
// le tape lui-même. Le statut de vérification ne se pose pas ici : la base le
// met à « a_verifier » dès que le numéro est enregistré, et une tâche côté
// serveur revérifie ensuite (Studio-ZeroQuatre-OS, supabase-verification-tva.sql).
//
// Statuts rendus au navigateur :
//   trouve       VIES confirme et donne nom + adresse → le client confirme
//   incomplet    VIES confirme mais masque nom ou adresse → saisie manuelle
//   inconnu      VIES ne connaît pas le numéro → saisie manuelle, sans blocage
//   invalide     le numéro est mal formé → le client corrige
//   indisponible VIES ne répond pas → réessayer, ou saisie manuelle

// Les essais peuvent prendre une vingtaine de secondes au pire.
export const maxDuration = 30

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

  const { cas, reponse, erreur } = await interrogerVies(chiffres)

  if (cas !== 'valide') {
    if (erreur) console.error('[espace/tva] VIES', erreur)
    const statut = { non_assujetti: 'inconnu', invalide: 'invalide' }[cas] || 'indisponible'
    return NextResponse.json({ statut, tva: chiffres })
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
