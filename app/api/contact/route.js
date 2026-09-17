import { NextResponse } from 'next/server'
import { sendMail, renderEmail } from '@/lib/mailer'
import {
  limiteAtteinte, piegeRempli, emailValide, tronquer, LONGUEURS,
} from '@/lib/limite-debit'

export async function POST(request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: 'Requête illisible' }, { status: 400 })
  }

  // Le champ piège d'abord : inutile de compter dans la limite un robot qu'on
  // a déjà reconnu. On lui répond que tout s'est bien passé — lui dire qu'il
  // est repéré, c'est lui apprendre à ne plus l'être.
  if (piegeRempli(body)) {
    return NextResponse.json({ success: true })
  }

  if (limiteAtteinte(request)) {
    return NextResponse.json(
      { success: false, error: 'Trop de messages envoyés. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  const name = tronquer(body.name, LONGUEURS.nom)
  const email = tronquer(body.email, LONGUEURS.email)
  const message = tronquer(body.message, LONGUEURS.message)

  if (!name || !email || !message) {
    return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })
  }
  if (!emailValide(email)) {
    return NextResponse.json({ success: false, error: 'Adresse email invalide' }, { status: 400 })
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
