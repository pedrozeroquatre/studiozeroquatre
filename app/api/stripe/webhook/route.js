import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'
import { getStripe } from '@/lib/stripe'

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
