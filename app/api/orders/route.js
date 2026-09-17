import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'
import { generateRef } from '@/lib/generateRef'
import {
  limiteAtteinte, piegeRempli, emailValide, tronquer, LONGUEURS,
} from '@/lib/limite-debit'

// Au-delà, ce n'est plus une demande de devis.
const MAX_PRODUITS = 20

export async function POST(request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: 'Requête illisible' }, { status: 400 })
  }

  // Voir la route contact : on répond « c'est parti » au robot reconnu plutôt
  // que de lui apprendre qu'il est repéré.
  if (piegeRempli(body)) {
    return NextResponse.json({ success: true, ref: generateRef() })
  }

  if (limiteAtteinte(request)) {
    return NextResponse.json(
      { success: false, error: 'Trop de demandes envoyées. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  const restaurant = tronquer(body.restaurant, LONGUEURS.restaurant)
  const name = tronquer(body.name, LONGUEURS.nom)
  const email = tronquer(body.email, LONGUEURS.email)
  const phone = tronquer(body.phone, LONGUEURS.telephone)
  const boxType = tronquer(body.boxType, LONGUEURS.nom)
  const notes = tronquer(body.notes, LONGUEURS.notes)

  if (!restaurant || !name || !email) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }
  if (!emailValide(email)) {
    return NextResponse.json({ success: false, error: 'Adresse email invalide' }, { status: 400 })
  }

  const ref = generateRef()

  // Le formulaire envoie un tableau `products` : { product, dimension, volume }.
  const items = (Array.isArray(body.products) ? body.products : [])
    .filter((p) => p && p.product)
    .slice(0, MAX_PRODUITS)
    .map((p) => ({
      product: tronquer(p.product, LONGUEURS.nom),
      dimension: tronquer(p.dimension, LONGUEURS.nom),
      volume: tronquer(p.volume, LONGUEURS.nom),
    }))
  const describe = (p) => [p.product, p.dimension, p.volume].filter(Boolean).join(' — ')

  const lines = [
    `Référence : ${ref}`,
    ``,
    `Restaurant : ${restaurant}`,
    `Contact : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : null,
    ``,
    `Produits :`,
    ...(items.length ? items.map((p) => `  • ${describe(p)}`) : ['  —']),
    ``,
    `Type de packaging : ${boxType || '—'}`,
    notes ? `\nNotes :\n${notes}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')

  // Une ligne HTML par produit (numérotée s'il y en a plusieurs).
  const productRows = items.length
    ? items.map((p, i) => [
        items.length > 1 ? `Produit ${i + 1}` : 'Produit',
        [p.product, p.dimension, p.volume].filter(Boolean).join('  ·  '),
      ])
    : [['Produits', '—']]

  try {
    await sendMail({
      fromName: `${restaurant} · ${name}`,
      subject: `Nouvelle demande de devis — ${restaurant} (${ref})`,
      text: lines,
      html: renderEmail({
        title: `Demande de devis — ${ref}`,
        rows: [
          ['Restaurant', restaurant],
          ['Contact', name],
          ['Email', email],
          ['Téléphone', phone],
          ...productRows,
          ['Type de packaging', boxType || '—'],
        ],
        message: notes ? `Notes :\n${notes}` : undefined,
      }),
      replyTo: email,
    })
  } catch (err) {
    console.error('[orders] envoi email échoué', err)
    return NextResponse.json({ success: false, error: "L'envoi a échoué. Veuillez réessayer." }, { status: 502 })
  }

  return NextResponse.json({ success: true, ref })
}
