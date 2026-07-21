import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'

export async function POST(request) {
  const body = await request.json()
  const { name, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }

  try {
    await sendMail({
      fromName: `${name} · ${email}`,
      subject: `Nouveau message de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
      html: renderEmail({
        title: 'Nouveau message — formulaire contact',
        rows: [
          ['Nom', name],
          ['Email', email],
        ],
        message,
      }),
      replyTo: email,
    })
  } catch (err) {
    console.error('[contact] envoi email échoué', err)
    return NextResponse.json({ success: false, error: "L'envoi a échoué. Veuillez réessayer." }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
