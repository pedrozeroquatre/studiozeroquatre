import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateRef } from '@/lib/generateRef'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const body = await request.json()
  const { restaurant, name, email, phone, formats, volume, boxType, notes } = body

  if (!restaurant || !name || !email) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }

  const ref = generateRef()

  const lines = [
    `Référence : ${ref}`,
    ``,
    `Restaurant : ${restaurant}`,
    `Contact : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : null,
    ``,
    `Formats souhaités : ${formats?.length ? formats.join(', ') : '—'}`,
    `Volume mensuel : ${volume || '—'}`,
    `Type de boîte : ${boxType || '—'}`,
    notes ? `\nNotes :\n${notes}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')

  await resend.emails.send({
    from: 'Studio Zeroquatre <contact@studiozeroquatre.com>',
    to: 'contact@studiozeroquatre.com',
    replyTo: email,
    subject: `Nouvelle demande de devis — ${restaurant} (${ref})`,
    text: lines,
  })

  // GOOGLE SHEETS HOOK [orders]:
  // 1. npm install googleapis
  // 2. Add env vars: GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), SPREADSHEET_ID, ORDERS_SHEET_NAME
  // 3. import { appendRow } from '@/lib/sheets'
  //    await appendRow(process.env.ORDERS_SHEET_NAME, [ref, new Date().toISOString(), restaurant, name, email, phone, formats?.join(', '), volume, boxType, notes])

  return NextResponse.json({ success: true, ref })
}
