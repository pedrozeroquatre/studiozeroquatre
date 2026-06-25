import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const body = await request.json()
  const { name, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }

  await resend.emails.send({
    from: 'Studio Zeroquatre <contact@studiozeroquatre.com>',
    to: 'contact@studiozeroquatre.com',
    replyTo: email,
    subject: `Nouveau message de ${name}`,
    text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
  })

  return NextResponse.json({ success: true })
}
