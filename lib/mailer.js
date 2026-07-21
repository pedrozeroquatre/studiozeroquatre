import nodemailer from 'nodemailer'

// Envoi via le SMTP de Namecheap Private Email. Le serveur du site se connecte à
// la boîte contact@ et lui envoie les notifications de formulaire — pas de Resend
// ni de config DNS : Private Email gère déjà SPF/DKIM pour le domaine.
//
// Env (.env.local) :
//   SMTP_USER=contact@studiozeroquatre.com
//   SMTP_PASSWORD=<mot de passe de la boîte>
//   SMTP_HOST (optionnel, défaut mail.privateemail.com)
//   SMTP_PORT (optionnel, défaut 465 = SSL)
let transporter

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // port 465 = SSL direct
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }
  return transporter
}

// Envoie une notif interne : l'adresse d'expéditeur reste la boîte contact@
// (seule adresse autorisée par le SMTP), mais `fromName` sert de nom affiché —
// on y met le visiteur pour le voir direct dans la liste des mails. `replyTo`
// porte son email → réponse en un clic. `html` = version formatée (optionnelle),
// `text` = secours pour les clients sans HTML. nodemailer throw en cas d'échec.
export async function sendMail({ subject, text, html, replyTo, fromName }) {
  const box = process.env.SMTP_USER
  await getTransporter().sendMail({
    from: `${fromName || 'Studio Zeroquatre'} <${box}>`,
    to: box,
    replyTo,
    subject,
    text,
    ...(html ? { html } : {}),
  })
}

// Échappe les valeurs saisies par le visiteur avant injection dans le HTML.
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Gabarit d'email sobre (noir/blanc, styles inline pour compat clients mail).
//   title   : sous-titre affiché dans l'en-tête
//   rows    : [[label, valeur], …] — les lignes null/undefined sont ignorées
//   message : bloc de texte libre optionnel (message contact, notes devis)
export function renderEmail({ title, rows = [], message }) {
  const body = rows
    .filter((r) => r && r[1] != null && r[1] !== '')
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 22px;color:#666;border-bottom:1px solid #f0f0f0;width:38%;vertical-align:top;font-size:13px;">${esc(label)}</td>
          <td style="padding:10px 22px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#0a0a0a;">${esc(value)}</td>
        </tr>`
    )
    .join('')

  const messageBlock = message
    ? `<div style="padding:18px 22px;font-size:14px;line-height:1.55;color:#0a0a0a;white-space:pre-wrap;border-top:1px solid #e8e8e8;">${esc(message)}</div>`
    : ''

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f7f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e8e8;border-radius:3px;overflow:hidden;">
      <div style="background:#0a0a0a;color:#fff;padding:16px 22px;">
        <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Studio Zeroquatre</div>
        <div style="font-size:15px;margin-top:2px;color:#e8e8e8;">${esc(title)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">${body}</table>
      ${messageBlock}
    </div>
  </body>
</html>`
}
