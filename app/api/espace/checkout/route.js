import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { TVA_TAUX } from '@/lib/tva'
import { creneauPasse, estCreneau, normaliserHeure } from '@/lib/creneaux'

// Création de la session de paiement de l'espace client.
//
// Le navigateur envoie des quantités, une date et son jeton de session — jamais
// un prix. Cette route relit le tarif depuis la base et recalcule le montant.
// **Les prix ne voyagent pas depuis le navigateur — garder ça comme ça.**
//
// Le tarif de la base est HTVA ; le client, lui, paie le TTC. Les lignes
// envoyées à Stripe restent donc HTVA et la TVA est posée par-dessus (voir
// `tauxTvaStripe` plus bas) : `amount_subtotal` reste l'assiette HTVA que la
// base enregistre, `amount_total` est ce qui est débité.
//
// Elle travaille avec le jeton du client, pas avec une clé de service : chaque
// requête part sous son identité, donc RLS s'applique exactement comme dans son
// navigateur. Un jeton trafiqué ne lit rien. Aucune clé secrète Supabase n'entre
// dans ce fichier.
//
// L'écriture en base, elle, n'a pas lieu ici : c'est l'Edge Function
// `enregistrer-commande-payee` qui la fait, une fois Stripe confirmé.

// — La TVA —
//
// Les lignes envoyées à Stripe restent HTVA : c'est ce que la base enregistre
// (`livraisons.prix_htva`) et ce sur quoi l'OS calcule tout. La TVA est ajoutée
// par-dessus par Stripe, via un objet TaxRate — le client voit donc « TVA 21 % »
// détaillée sur la page de paiement et sur son reçu, et paie bien le TTC.
//
// Le TaxRate est cherché avant d'être créé, et mémorisé : une instance chaude
// ne rappelle pas Stripe. Si deux instances froides en créent deux identiques,
// c'est sans conséquence.
//
// Il n'y a volontairement PAS de repli sans TVA : facturer HTVA laisserait le
// studio devoir 21 % de sa poche. Mieux vaut que le paiement refuse de s'ouvrir.
let idTauxTva = null

async function tauxTvaStripe(stripe) {
  if (idTauxTva) return idTauxTva

  if (process.env.STRIPE_TAX_RATE_TVA) {
    idTauxTva = process.env.STRIPE_TAX_RATE_TVA
    return idTauxTva
  }

  const { data } = await stripe.taxRates.list({ active: true, limit: 100 })
  const existant = data.find(t => !t.inclusive && Number(t.percentage) === TVA_TAUX)
  if (existant) {
    idTauxTva = existant.id
    return idTauxTva
  }

  const cree = await stripe.taxRates.create({
    display_name: 'TVA',
    description: `TVA belge ${TVA_TAUX} %`,
    percentage: TVA_TAUX,
    inclusive: false,
    country: 'BE',
  })
  idTauxTva = cree.id
  return idTauxTva
}

// L'adresse où Stripe renvoie le client après le paiement.
//
// Elle ne doit JAMAIS venir du navigateur. L'en-tête `Origin` est envoyé par
// l'appelant, qui peut y mettre ce qu'il veut : construire l'adresse de retour
// dessus laisse quelqu'un faire revenir la page d'après-paiement sur son propre
// site. En production, elle est donc figée.
//
// En développement seulement, on retombe sur l'adresse du serveur lui-même
// (`request.url`, qui est la nôtre, pas un en-tête du client) pour que le
// retour marche sur localhost.
const SITE = 'https://www.studiozeroquatre.com'

function origineSure(request) {
  const declaree = process.env.NEXT_PUBLIC_SITE_URL
  if (declaree) return declaree.replace(/\/+$/, '')
  if (process.env.NODE_ENV !== 'production') return new URL(request.url).origin
  return SITE
}

// Client Supabase agissant AU NOM du visiteur connecté.
function supabasePourJeton(jeton) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cle) return null

  return createClient(url, cle, {
    global: { headers: { Authorization: `Bearer ${jeton}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request) {
  const { jeton, lignes, date, heure, note, etablissement } = await request.json()

  if (!jeton) {
    return NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 })
  }

  const sb = supabasePourJeton(jeton)
  if (!sb) {
    return NextResponse.json({ error: 'Espace non configuré.' }, { status: 503 })
  }

  // — Qui commande ? —
  const [{ data: clientId, error: eClient }, { data: etabRattache }] = await Promise.all([
    sb.rpc('mon_client_id'),
    sb.rpc('mon_etablissement_id'),
  ])

  if (eClient || !clientId) {
    return NextResponse.json({ error: 'Compte non reconnu.' }, { status: 403 })
  }

  // Un compte rattaché à un restaurant commande toujours pour celui-là. Un
  // compte groupe choisit — et son choix est vérifié contre la vue, qui ne
  // contient que SES restaurants : impossible de commander pour un autre.
  let etablissementId = etabRattache ?? null
  if (!etablissementId) {
    if (!etablissement) {
      return NextResponse.json({ error: 'Choisissez le restaurant à livrer.' }, { status: 400 })
    }
    const { data: sien } = await sb
      .from('portail_mes_etablissements')
      .select('id')
      .eq('id', etablissement)
      .limit(1)
    if (!sien?.length) {
      return NextResponse.json({ error: 'Restaurant inconnu.' }, { status: 403 })
    }
    etablissementId = etablissement
  }

  // — La date —
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return NextResponse.json({ error: 'Choisissez une date de livraison.' }, { status: 400 })
  }
  const aujourdhui = new Date().toISOString().slice(0, 10)
  if (date < aujourdhui) {
    return NextResponse.json({ error: 'Cette date est déjà passée.' }, { status: 400 })
  }

  // La capacité est de 4 livraisons par jour. La vue ne rend que les jours
  // pleins ; si elle n'existe pas encore, on laisse passer plutôt que de
  // bloquer toutes les commandes.
  const { data: complets } = await sb.from('portail_jours_complets').select('date').eq('date', date)
  if (complets?.length) {
    return NextResponse.json(
      { error: 'Cette journée est complète. Choisissez une autre date.' },
      { status: 409 },
    )
  }

  // — L'heure, facultative —
  //
  // Rien de choisi : la livraison passe dans la journée, et `heure_livraison`
  // reste à NULL. C'est le cas par défaut, il ne doit jamais devenir une erreur.
  //
  // Une heure choisie, en revanche, doit être un créneau de la liste ET être
  // encore libre. Le navigateur a déjà grisé les créneaux pris, mais il a pu
  // les lire il y a dix minutes : c'est ici que ça se tranche.
  let creneau = null
  if (heure !== null && heure !== undefined && heure !== '') {
    if (!estCreneau(heure)) {
      return NextResponse.json({ error: 'Cette heure de livraison n’est pas proposée.' }, { status: 400 })
    }
    creneau = normaliserHeure(heure)

    // Le calendrier laisse choisir aujourd'hui : encore faut-il que le créneau
    // ne soit pas déjà passé. Calculé à l'heure de Bruxelles, pas à celle du
    // serveur, qui tourne en UTC.
    if (creneauPasse(date, creneau)) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà passé. Choisissez-en un autre.' },
        { status: 409 },
      )
    }

    const { data: pris, error: ePris } = await sb
      .from('portail_creneaux_pris')
      .select('date, heure')
      .eq('date', date)
      .eq('heure', creneau)

    // Vue absente (base pas encore à jour) : on ne peut rien garantir, donc on
    // ne promet rien — la livraison passe dans la journée plutôt que de
    // réserver une heure qu'on n'a pas su vérifier.
    if (ePris) {
      creneau = null
    } else if (pris?.length) {
      return NextResponse.json(
        { error: 'Ce créneau vient d’être réservé. Choisissez-en un autre.' },
        { status: 409 },
      )
    }
  }

  // — Le tarif, lu en base —
  const { data: tarifs, error: eTarif } = await sb
    .from('portail_mon_tarif')
    .select('prix_unitaire_htva')
    .limit(1)

  const prix = Number(tarifs?.[0]?.prix_unitaire_htva)
  if (eTarif || !Number.isFinite(prix) || prix <= 0) {
    return NextResponse.json(
      { error: 'Votre tarif n’est pas encore enregistré. Contactez le studio.' },
      { status: 409 },
    )
  }

  // — Les lignes, revalidées —
  const propres = []
  for (const l of Array.isArray(lignes) ? lignes : []) {
    const quantite = parseInt(l?.quantite, 10)
    const reference = typeof l?.reference === 'string' ? l.reference.slice(0, 120) : ''
    if (!reference || !Number.isFinite(quantite) || quantite < 1 || quantite > 1_000_000) continue
    propres.push({ reference, quantite })
  }
  if (!propres.length) {
    return NextResponse.json({ error: 'Commande vide.' }, { status: 400 })
  }
  if (propres.length > 50) {
    return NextResponse.json({ error: 'Trop de lignes dans une même commande.' }, { status: 400 })
  }

  // Le prix unitaire est en numeric(10,4) : à 0,2550 € la boîte, facturer
  // ligne par ligne au centime perdrait des fractions. On facture donc chaque
  // format en UNE ligne, d'un montant = arrondi(quantité × prix).
  const articles = propres.map(l => ({
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: Math.round(l.quantite * prix * 100),
      product_data: {
        name: `${l.reference} — ${l.quantite.toLocaleString('fr-BE')} boîtes`,
      },
    },
  }))

  const totalCents = articles.reduce((s, a) => s + a.price_data.unit_amount, 0)
  if (totalCents <= 0) {
    return NextResponse.json({ error: 'Montant nul.' }, { status: 400 })
  }

  const origine = origineSure(request)

  try {
    const stripe = getStripe()
    const tva = await tauxTvaStripe(stripe)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: articles.map(a => ({ ...a, tax_rates: [tva] })),
      success_url: `${origine}/espace?paiement=succes`,
      cancel_url: `${origine}/espace?paiement=annule`,
      // Ce que l'Edge Function relira pour créer la commande et la livraison.
      // `source` la distingue des paiements de l'ancien portail, qui partent
      // sur le webhook du site.
      metadata: {
        source: 'espace',
        client_id: String(clientId),
        etablissement_id: String(etablissementId),
        date_livraison: date,
        heure_livraison: creneau ?? '',
        lignes: JSON.stringify(propres).slice(0, 490),
        note: (typeof note === 'string' ? note : '').slice(0, 490),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[espace/checkout] Stripe', err)
    return NextResponse.json({ error: 'Le paiement n’a pas pu être ouvert.' }, { status: 502 })
  }
}
