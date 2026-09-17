// Protection des formulaires publics.
//
// Le site envoie ses mails depuis la vraie boîte contact@ : une boucle sur un
// formulaire la noie, fait sauter le quota d'envoi de Private Email, et finit
// par faire blacklister le domaine. Le jour où ça arrive, une vraie demande de
// devis n'arrive plus — sans message d'erreur, sans que personne s'en aperçoive.
//
// Trois défenses, du plus efficace au plus symbolique :
//
//   1. le champ piège — invisible pour un humain, rempli par les robots qui
//      remplissent tout ce qu'ils trouvent. C'est ce qui arrête l'écrasante
//      majorité du bruit, et ça ne coûte rien au visiteur ;
//   2. la limite par adresse — quelques envois par heure ;
//   3. les longueurs maximales — un message de 10 Mo ne part pas par mail.
//
// ⚠ Le compteur de la défense 2 vit dans la MÉMOIRE de l'instance. Sur Vercel,
// plusieurs instances répondent en parallèle et chacune a le sien : c'est un
// plafond par instance, pas une garantie. Il arrête les boucles bêtes, pas un
// attaquant distribué et déterminé. Une vraie garantie demanderait un compteur
// partagé (une table Postgres, un Redis) — à faire le jour où ça devient un
// problème réel, pas avant.

const FENETRE_MS = 60 * 60 * 1000 // une heure
const MAX_PAR_FENETRE = 5

// adresse → tableau d'horodatages, purgé au fil de l'eau.
const envois = new Map()

// Vercel place l'adresse réelle du visiteur en tête de x-forwarded-for ; le
// reste de la chaîne, ce sont ses propres relais. Un en-tête forgé n'est pas un
// souci ici : au pire l'attaquant se donne un compteur neuf, ce que faire
// tourner son adresse lui donnerait de toute façon.
function adresse(request) {
  const chaine = request.headers.get('x-forwarded-for')
  if (chaine) return chaine.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'inconnue'
}

export function limiteAtteinte(request) {
  const cle = adresse(request)
  const maintenant = Date.now()

  // Purge : sans elle, la Map grossirait indéfiniment sur une instance chaude.
  for (const [k, dates] of envois) {
    const recents = dates.filter((d) => maintenant - d < FENETRE_MS)
    if (recents.length) envois.set(k, recents)
    else envois.delete(k)
  }

  const recents = envois.get(cle) || []
  if (recents.length >= MAX_PAR_FENETRE) return true

  envois.set(cle, [...recents, maintenant])
  return false
}

// Le champ piège. Il est posé dans le formulaire, masqué à l'œil et retiré du
// parcours au clavier : un humain ne peut pas le remplir. Un robot qui remplit
// tous les champs se trahit.
export const CHAMP_PIEGE = 'site_web'

export function piegeRempli(corps) {
  const valeur = corps?.[CHAMP_PIEGE]
  return typeof valeur === 'string' && valeur.trim() !== ''
}

// Une validation d'adresse volontairement large : le but est d'écarter ce qui
// ne peut pas être une adresse, pas d'arbitrer les cas limites de la norme.
export function emailValide(valeur) {
  return typeof valeur === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur.trim())
}

export function tronquer(valeur, max) {
  if (typeof valeur !== 'string') return ''
  return valeur.trim().slice(0, max)
}

export const LONGUEURS = {
  nom: 120,
  email: 200,
  telephone: 40,
  restaurant: 160,
  message: 5000,
  notes: 5000,
}
