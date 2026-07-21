import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { findClientById } from '@/lib/clients'
import { generateRef } from '@/lib/generateRef'

export async function POST(request) {
  const { clientId, quantities, note } = await request.json()

  const client = findClientById(clientId)
  if (!client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  // Recompute lines from the server-side product list. Quantities come from the
  // browser; prices never do.
  const lineItems = []
  const summary = []
  let total = 0

  for (const p of client.products) {
    const qty = parseInt(quantities?.[p.id] ?? 0, 10)
    if (!Number.isFinite(qty) || qty <= 0) continue

    // Per-box prices are fractional cents (e.g. 0,0883 €). To keep the total
    // exact, bill each format as a single line = round(qty × price) in cents.
    const amount = Math.round(qty * p.price * 100)
    if (amount <= 0) continue

    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: amount,
        product_data: { name: `${p.fmt} — ${p.qual}`, description: `${qty.toLocaleString('fr-BE')} boîtes` },
      },
    })
    summary.push(`${p.fmt} × ${qty}`)
    total += amount
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'Commande vide' }, { status: 400 })
  }

  const ref = generateRef()
  const origin = request.headers.get('origin') || new URL(request.url).origin

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${origin}/portal?checkout=success&ref=${ref}`,
    cancel_url: `${origin}/portal?checkout=cancel`,
    metadata: {
      ref,
      clientId: client.id,
      clientName: client.name,
      lines: summary.join(', ').slice(0, 490),
      note: (typeof note === 'string' ? note : '').slice(0, 490),
    },
  })

  return NextResponse.json({ url: session.url })
}
