// Les créneaux de livraison.
//
// Le client n'est PAS obligé de choisir une heure : sans choix, la livraison
// passe « dans la journée » et `livraisons.heure_livraison` reste à NULL. C'est
// le défaut, et le cas le plus fréquent — ne jamais rendre ce champ obligatoire.
//
// Quand il choisit, il choisit dans une liste fermée : une heure libre laisserait
// passer 10h15 et 10h20 comme deux créneaux « libres » alors que la camionnette
// ne peut pas faire les deux. Des créneaux d'une heure se comparent, eux, sans
// ambiguïté — c'est ce qui rend la vérification de disponibilité honnête.
//
// Un créneau pris l'est pour TOUT LE MONDE : le studio ne peut pas être à deux
// endroits à la fois. La vue `portail_creneaux_pris` ne dit que ça — une date et
// une heure, jamais chez qui.

const PREMIER = 8   // premier créneau : 8 h
const DERNIER = 18  // fin du dernier créneau : 18 h (donc le dernier commence à 17 h)

export const CRENEAUX = Array.from(
  { length: DERNIER - PREMIER },
  (_, i) => `${String(PREMIER + i).padStart(2, '0')}:00`,
)

// Postgres rend un `time` en « 10:00:00 » ; le navigateur envoie « 10:00 ».
// Tout se compare sur la forme courte.
export function normaliserHeure(valeur) {
  if (typeof valeur !== 'string') return null
  const court = valeur.slice(0, 5)
  return /^\d{2}:\d{2}$/.test(court) ? court : null
}

// Une heure qui ne vient pas de la liste n'est pas un créneau : la route de
// paiement refuse plutôt que de réserver quelque chose d'intenable.
export function estCreneau(valeur) {
  const h = normaliserHeure(valeur)
  return h !== null && CRENEAUX.includes(h)
}

// '10:00' → « 10h–11h » ; rien → « Dans la journée ».
export function formatCreneau(valeur) {
  const h = normaliserHeure(valeur)
  if (!h) return 'Dans la journée'
  const debut = parseInt(h.slice(0, 2), 10)
  return `${debut}h–${debut + 1}h`
}

// Clé de comparaison entre ce que le client a choisi et ce que la vue renvoie.
export function cleCreneau(date, heure) {
  return `${date} ${normaliserHeure(heure) ?? ''}`
}

// L'heure de Bruxelles, calculée pareil dans le navigateur et sur le serveur.
// Vercel tourne en UTC : sans le fuseau explicite, le serveur se croirait une
// ou deux heures plus tôt et laisserait réserver un créneau déjà passé.
export function maintenantBruxelles() {
  const parties = new Intl.DateTimeFormat('fr-BE', {
    timeZone: 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())

  const p = Object.fromEntries(
    parties.filter(x => x.type !== 'literal').map(x => [x.type, x.value]),
  )
  return { date: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` }
}

// Un créneau de ce matin n'est plus disponible cet après-midi. Sans ça, le
// calendrier laissant choisir aujourd'hui, on pourrait réserver 8 h à 16 h.
export function creneauPasse(date, creneau) {
  const h = normaliserHeure(creneau)
  if (!h) return false
  const maintenant = maintenantBruxelles()
  return date === maintenant.date && h <= maintenant.heure
}
