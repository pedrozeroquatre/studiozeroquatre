import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'
import { getStripe } from '@/lib/stripe'
import { findClientById } from '@/lib/clients'
import { buildItems, recordPaidOrder } from '@/lib/orders-store'

// Stripe needs the raw request body to verify the signature — never parse it as
// JSON before verifying.
export async function POST(request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = request.headers.get('stripe-signature')
  const raw = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    return NextResponse.json({ error: `Signature invalide : ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const m = session.metadata || {}

    // Les paiements de l'espace client (/espace) ne passent pas par ici : ils
    // sont écrits en base par l'Edge Function Supabase
    // `enregistrer-commande-payee`, qui crée la commande ET la livraison. Ce
    // webhook-ci ne connaît que l'ancien portail (/portal) et ses métadonnées ;
    // sans ce garde-fou, il enverrait un email de commande vide.
    if (m.source === 'espace') {
      return NextResponse.json({ received: true, ignored: 'espace' })
    }
    const total = ((session.amount_total ?? 0) / 100).toFixed(2).replace('.', ',')

    const lines = [
      `Référence : ${m.ref || '—'}`,
      ``,
      `Client : ${m.clientName || '—'}`,
      `Montant payé : ${total} €`,
      `Statut paiement : ${session.payment_status}`,
      ``,
      `Commande : ${m.lines || '—'}`,
      `Livraison souhaitée : ${m.delivery || '—'}`,
      m.note ? `\nNote :\n${m.note}` : null,
      ``,
      `Session Stripe : ${session.id}`,
    ]
      .filter((l) => l !== null)
      .join('\n')

    // Persistance d'abord : c'est la trace durable de la commande, l'email n'en
    // est qu'une notification. Les deux échouent indépendamment.
    try {
      const client = findClientById(m.clientId)
      let quantities = {}
      try {
        quantities = JSON.parse(m.qty || '{}')
      } catch {
        // Métadonnée absente ou corrompue (commande créée avant cette version) :
        // on enregistre quand même la commande, sans le détail des lignes.
      }

      await recordPaidOrder({
        ref: m.ref || session.id,
        clientId: m.clientId || 'inconnu',
        clientName: m.clientName || 'Client',
        items: client ? buildItems(client.products, quantities) : [],
        totalCents: session.amount_total ?? 0,
        currency: session.currency || 'eur',
        deliveryDate: m.deliveryDate || null,
        deliveryTime: m.deliveryTime || null,
        note: m.note || null,
        stripeSessionId: session.id,
      })
    } catch (err) {
      // Ne pas 500 vers Stripe : le paiement est encaissé, un rejeu ne le
      // changerait pas. L'email ci-dessous reste le filet de sécurité.
      console.error('[stripe webhook] enregistrement Supabase échoué', err)
    }

    try {
      await sendMail({
        fromName: `${m.clientName || 'Client'} · commande payée`,
        subject: `Commande payée — ${m.clientName || 'Client'} (${m.ref || session.id})`,
        text: lines,
        html: renderEmail({
          title: 'Commande payée',
          rows: [
            ['Référence', m.ref || '—'],
            ['Client', m.clientName || '—'],
            ['Montant payé', `${total} €`],
            ['Statut paiement', session.payment_status],
            ['Commande', m.lines || '—'],
            ['Livraison souhaitée', m.delivery || '—'],
            ['Session Stripe', session.id],
          ],
          message: m.note ? `Note du client :\n${m.note}` : undefined,
        }),
      })
    } catch (err) {
      // Don't 500 back to Stripe on email failure — the payment already
      // succeeded. Log so it can be retried/inspected.
      console.error('[stripe webhook] email échoué', err)
    }
  }

  return NextResponse.json({ received: true })
}
