import { getEspaceSupabase } from './supabase-browser'

// Accès aux données de l'espace client.
//
// Règle absolue (cf. PORTAIL-CLIENT.md) : le client n'a AUCUN droit sur les
// tables. On ne lit que les vues `portail_*` et on n'écrit que par la fonction
// `passer_commande()`. Les vues filtrent déjà sur le client et l'établissement
// du compte connecté : **aucun `where` à écrire ici**. Ajouter un filtre côté
// portail donnerait la fausse impression que c'est lui qui sécurise.
//
// Les colonnes sont listées explicitement plutôt que `select('*')` : si une vue
// change côté base, la requête échoue franchement au lieu d'afficher du vide.

const COLONNES = {
  profil: 'id, nom, etablissement, societe, contacts',
  etablissements: 'id, nom, societe',
  livraisons: 'id, date_livraison, etablissement, produits, prix_htva, tva_taux, livre, paiement_recu',
  livraisonsAvecHeure: 'id, date_livraison, heure_livraison, etablissement, produits, prix_htva, tva_taux, livre, paiement_recu',
  lignesLivraison: 'id, livraison_id, taille, quantite',
  stocks: 'id, reference, etablissement, paquets, conso_mensuelle',
  documents: 'id, type, numero, objet, date_doc, montant, statut, echeance',
  commandes: 'id, numero, etablissement, statut, demande_le, souhaitee_le, notes_client',
  lignesCommande: 'id, commande_id, reference, quantite',
  tarif: 'prix_unitaire_htva',
}

// Un paquet = 50 boîtes (unité de `portail_mes_stocks.paquets`).
export const BOITES_PAR_PAQUET = 50

// Les quatre formats du studio — repli quand le restaurant n'a encore aucune
// référence suivie en stock.
export const FORMATS_STUDIO = ['26×26×4', '30×30×4', '33×33×4', '36×36×4']

// ── Décalage d'horloge entre les services Supabase ──────────────────────────
// Juste après l'ouverture d'une session — et surtout juste après le choix du
// mot de passe, quand le jeton a une seconde d'âge — PostgREST peut refuser la
// lecture avec « JWT issued at future » : GoTrue a daté le jeton avec son
// horloge, PostgREST le valide avec la sienne, et les deux ne sont pas
// parfaitement alignées. Ça se résorbe tout seul en une poignée de secondes.
//
// On réessaie donc au lieu d'envoyer le client sur un écran d'erreur à
// l'instant précis où il vient de créer son accès. **Lectures uniquement** :
// rejouer `passer_commande()` créerait une deuxième commande.
const ERREUR_HORLOGE = /issued at future|not yet valid|PGRST301/i

async function avecReprise(lecture, essais = 3) {
  for (let tentative = 1; ; tentative++) {
    try {
      return await lecture()
    } catch (e) {
      if (tentative >= essais || !ERREUR_HORLOGE.test(e?.message || '')) throw e
      await new Promise(r => setTimeout(r, 900 * tentative))
    }
  }
}

// ── Identité du compte connecté ─────────────────────────────────────────────
// mon_client_id()        → le client, ou null si ce n'est pas un compte client
//                          (un compte du studio, par exemple).
// mon_etablissement_id() → le restaurant précis, ou null pour un compte
//                          « groupe » qui voit tous les restaurants du client.
export async function chargerIdentite() {
  const sb = getEspaceSupabase()
  if (!sb) throw new Error('Espace non configuré')

  return avecReprise(async () => {
    const [client, etablissement] = await Promise.all([
      sb.rpc('mon_client_id'),
      sb.rpc('mon_etablissement_id'),
    ])

    if (client.error) throw client.error
    if (etablissement.error) throw etablissement.error

    return {
      clientId: client.data ?? null,
      etablissementId: etablissement.data ?? null,
    }
  })
}

// ── Toutes les données de l'espace ──────────────────────────────────────────
export async function chargerEspace() {
  const sb = getEspaceSupabase()
  if (!sb) throw new Error('Espace non configuré')

  return avecReprise(() => lireTout(sb))
}

// `portail_mon_tarif` est une vue OPTIONNELLE, proposée dans
// supabase/vue-tarif.sql et pas encore forcément créée côté base. Tant qu'elle
// n'existe pas, l'espace tourne sans montant plutôt que de tomber en panne :
// on avale l'erreur ici, et seulement ici.
//
// Un seul prix par client, valable pour TOUS les formats — c'est le modèle de
// la base (`clients.prix`, un scalaire).
async function lireTarif(sb) {
  try {
    const { data, error } = await sb.from('portail_mon_tarif').select(COLONNES.tarif).limit(1)
    if (error) return null
    const prix = Number(data?.[0]?.prix_unitaire_htva)
    return Number.isFinite(prix) && prix > 0 ? prix : null
  } catch {
    return null
  }
}

// Jours où la tournée est déjà complète (4 livraisons). Vue optionnelle, comme
// le tarif : absente, on n'interdit rien — la route de paiement revérifie.
async function lireJoursComplets(sb) {
  try {
    const { data, error } = await sb.from('portail_jours_complets').select('date')
    if (error) return []
    return (data ?? []).map(r => r.date).filter(Boolean)
  } catch {
    return []
  }
}

// Créneaux d'une heure déjà réservés, tous clients confondus. Vue optionnelle
// elle aussi : tant qu'elle n'existe pas, l'espace ne propose simplement aucune
// heure (cf. `heuresDisponibles` côté composant), et la route de paiement
// revérifie de toute façon.
async function lireCreneauxPris(sb) {
  try {
    const { data, error } = await sb.from('portail_creneaux_pris').select('date, heure')
    if (error) return null
    return (data ?? []).filter(r => r.date && r.heure)
  } catch {
    return null
  }
}

// `heure_livraison` est une colonne récente de `portail_mes_livraisons`. Si la
// base n'a pas encore reçu supabase/paiement-et-capacite.sql, on relit sans
// elle plutôt que de laisser TOUT l'espace en panne — profil, stocks et
// documents compris — pour une colonne d'affichage.
async function lireLivraisons(sb) {
  const requete = colonnes => sb.from('portail_mes_livraisons')
    .select(colonnes)
    .order('date_livraison', { ascending: false })

  const avec = await requete(COLONNES.livraisonsAvecHeure)
  if (!avec.error) return avec
  return requete(COLONNES.livraisons)
}

async function lireTout(sb) {
  const [
    tarif,
    joursComplets,
    creneauxPris,
    profil,
    etablissements,
    livraisons,
    lignesLivraison,
    stocks,
    documents,
    commandes,
    lignesCommande,
  ] = await Promise.all([
    lireTarif(sb),
    lireJoursComplets(sb),
    lireCreneauxPris(sb),
    sb.from('portail_mon_profil').select(COLONNES.profil),
    sb.from('portail_mes_etablissements').select(COLONNES.etablissements).order('nom'),
    lireLivraisons(sb),
    sb.from('portail_mes_lignes_livraison').select(COLONNES.lignesLivraison),
    sb.from('portail_mes_stocks').select(COLONNES.stocks).order('reference'),
    sb.from('portail_mes_documents').select(COLONNES.documents).order('date_doc', { ascending: false }),
    sb.from('portail_mes_commandes').select(COLONNES.commandes).order('demande_le', { ascending: false }),
    sb.from('portail_mes_lignes_commande').select(COLONNES.lignesCommande),
  ])

  const reponses = { profil, etablissements, livraisons, lignesLivraison, stocks, documents, commandes, lignesCommande }
  for (const [nom, r] of Object.entries(reponses)) {
    if (r.error) throw Object.assign(new Error(`${nom} : ${r.error.message}`), { cause: r.error })
  }

  return {
    ...Object.fromEntries(Object.entries(reponses).map(([nom, r]) => [nom, r.data ?? []])),
    tarif,
    joursComplets,
    creneauxPris,
  }
}

// ── Passer commande ─────────────────────────────────────────────────────────
// PLUS APPELÉE PAR /espace depuis que le parcours passe systématiquement par
// Stripe : une commande sans paiement n'apparaissait dans aucun écran du
// studio, donc personne ne la traitait. Conservée parce que `passer_commande()`
// reste la seule écriture que la base autorise au client, et que c'est par elle
// qu'il faudra repasser le jour où on voudra un devis ou une demande sans
// paiement — auquel cas il faudra AUSSI un écran côté OS pour les voir.
//
// Seule écriture autorisée au client. La fonction impose elle-même le client et
// le statut : impossible de commander au nom d'un autre ou de s'auto-confirmer.
// Un compte rattaché à un restaurant commande toujours pour celui-là — le
// paramètre `etablissement` est alors ignoré côté base.
export async function passerCommande({ souhaitee, note, lignes, etablissement }) {
  const sb = getEspaceSupabase()
  if (!sb) throw new Error('Espace non configuré')

  const { data, error } = await sb.rpc('passer_commande', {
    souhaitee: souhaitee || null,
    note: note?.trim() ? note.trim() : null,
    lignes,
    etablissement: etablissement || null,
  })

  if (error) throw error
  return data
}

// ── Payer une commande ──────────────────────────────────────────────────────
// Ouvre une session Stripe. Le navigateur n'envoie que des quantités, une date
// et son jeton : **le montant est recalculé par le serveur** depuis le tarif en
// base. La commande et la livraison ne sont écrites qu'après le paiement, par
// l'Edge Function `enregistrer-commande-payee`.
export async function ouvrirPaiement({ lignes, date, heure, note, etablissement }) {
  const sb = getEspaceSupabase()
  if (!sb) throw new Error('Espace non configuré')

  const { data: { session } } = await sb.auth.getSession()
  if (!session) throw new Error('Session expirée. Reconnectez-vous.')

  const res = await fetch('/api/espace/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jeton: session.access_token, lignes, date, heure, note, etablissement }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Le paiement n’a pas pu être ouvert.')
  }
  return data.url
}

// Les mêmes garde-fous que la fonction SQL, appliqués avant l'appel : le
// restaurateur lit un message clair plutôt qu'une erreur Postgres. La base
// reste la seule autorité — ceci n'est que du confort.
export function verifierLignes(lignes) {
  if (!lignes.length) return 'Ajoutez au moins une quantité avant de valider.'
  if (lignes.length > 50) return 'Une commande ne peut pas dépasser 50 lignes.'
  for (const l of lignes) {
    if (!Number.isInteger(l.quantite) || l.quantite < 1 || l.quantite > 1_000_000) {
      return `Quantité invalide pour le format ${l.reference}.`
    }
  }
  return null
}

// ── Mise en forme ───────────────────────────────────────────────────────────

// '2026-09-15' → '15/09/2026'
export function formatDate(valeur) {
  if (!valeur) return '—'
  const d = new Date(valeur)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// '2026-09-15' → 'mardi 15 septembre'
export function formatDateLongue(valeur) {
  if (!valeur) return '—'
  const d = new Date(valeur)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatNombre(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v.toLocaleString('fr-BE') : '—'
}

export function formatEuros(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `${v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

// 0.27 → « 0,27 € » ; 0.255 → « 0,255 € ». Le prix unitaire est stocké en
// numeric(10,4) : on garde la précision réelle sans afficher « 0,2700 € ».
export function formatPrixUnitaire(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `${v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €`
}

// Montant exact en centimes, pour ne pas traîner les flottants dans les totaux.
export function montant(quantite, prixUnitaire) {
  return Math.round(Number(quantite) * Number(prixUnitaire) * 100) / 100
}

// « dans 3 jours », « aujourd'hui », « il y a 2 jours ». Sert à rendre une date
// de livraison lisible d'un coup d'œil.
export function joursRestants(valeur) {
  if (!valeur) return null
  const d = new Date(valeur)
  if (Number.isNaN(d.getTime())) return null
  const jour = v => Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())
  return Math.round((jour(d) - jour(new Date())) / 86400000)
}

// Regroupe des lignes par identifiant de parent (livraison_id / commande_id).
export function grouperPar(lignes, cle) {
  const map = new Map()
  for (const l of lignes) {
    const k = l[cle]
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(l)
  }
  return map
}

// `produits` (portail_mes_livraisons) peut arriver en texte ou en tableau selon
// la vue — on affiche les deux sans supposer lequel.
export function texteProduits(produits) {
  if (!produits) return ''
  if (Array.isArray(produits)) return produits.map(p => (typeof p === 'string' ? p : JSON.stringify(p))).join('   ·   ')
  if (typeof produits === 'string') return produits
  return ''
}
