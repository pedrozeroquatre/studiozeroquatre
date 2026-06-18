import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.json()

  // EMAIL HOOK [contact]:
  // 1. npm install resend (or nodemailer)
  // 2. Add env vars: RESEND_API_KEY, CONTACT_TO_EMAIL
  // 3. Replace console.log with:
  //    import { Resend } from 'resend'
  //    const resend = new Resend(process.env.RESEND_API_KEY)
  //    await resend.emails.send({
  //      from: 'Studio Zeroquatre <contact@studiozeroquatre.be>',
  //      to: process.env.CONTACT_TO_EMAIL,
  //      replyTo: body.email,
  //      subject: `Nouveau message de ${body.name}`,
  //      text: body.message,
  //    })
  console.log('[contact] New message:', JSON.stringify(body, null, 2))

  return NextResponse.json({ success: true })
}
