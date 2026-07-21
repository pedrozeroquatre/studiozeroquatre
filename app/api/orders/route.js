import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'
import { generateRef } from '@/lib/generateRef'

export async function POST(request) {
  const body = await request.json()
  const { restaurant, name, email, phone, products, boxType, notes } = body

  if (!restaurant || !name || !email) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }

  const ref = generateRef()

  // Le formulaire envoie un tableau `products` : { product, dimension, volume }.
  const items = Array.isArray(products) ? products.filter((p) => p && p.product) : []
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

  // GOOGLE SHEETS HOOK [orders]:
  // 1. npm install googleapis
  // 2. Add env vars: GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), SPREADSHEET_ID, ORDERS_SHEET_NAME
  // 3. import { appendRow } from '@/lib/sheets'
  //    await appendRow(process.env.ORDERS_SHEET_NAME, [ref, new Date().toISOString(), restaurant, name, email, phone, items.map(describe).join(' | '), boxType, notes])

  return NextResponse.json({ success: true, ref })
}
