'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getEspaceSupabase } from '@/lib/supabase-browser'
import { Ecran, CarteAuth, ChampTexte, BoutonPrincipal, C } from './ui'

// Lien d'invitation mort : expiré ou déjà utilisé. Supabase renvoie alors
// `#error=access_denied&error_code=otp_expired`.
//
// Le client se renvoie lui-même un lien neuf, sans passer par le studio : une
// fois l'accès ouvert depuis l'OS, Pedro n'a plus à y revenir, même si
// l'invitation dort des semaines dans la boîte mail. Le lien envoyé est un lien
// de réinitialisation : il atterrit sur ChoixMotDePasse, comme l'invitation, et
// vaut aussi pour un compte invité qui ne s'est jamais connecté.
export default function LienExpire({ onConnexion }) {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  async function envoyerNouveauLien(e) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true)

    const sb = getEspaceSupabase()
    if (sb && email.trim()) {
      // Résultat ignoré, comme dans Connexion : répondre « adresse inconnue »
      // ferait de ce formulaire un annuaire des clients du studio.
      await sb.auth
        .resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/espace`,
        })
        .catch(() => {})
    }

    setEnvoye(true)
    setEnvoi(false)
  }

  const lienConnexion = (
    <button
      onClick={onConnexion}
      style={{ display: 'block', margin: '20px auto 0', background: 'none', border: 'none', color: C.gris, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
    >
      J’ai déjà choisi mon mot de passe
    </button>
  )

  if (envoye) {
    return (
      <Ecran>
        <CarteAuth titre="Vérifiez vos mails">
          <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8 }}>
            Si un accès existe pour cette adresse, un nouveau lien vient d’être
            envoyé. Ouvrez-le dans ce navigateur pour choisir votre mot de passe.
            <br />
            <br />
            Pensez à regarder dans les indésirables.
          </div>
          {lienConnexion}
        </CarteAuth>
      </Ecran>
    )
  }

  return (
    <Ecran>
      <CarteAuth
        titre="Ce lien a expiré"
        intro="Les liens d’accès ne servent qu’une fois et ne durent pas. Indiquez votre adresse, nous vous en envoyons un nouveau."
      >
        <form onSubmit={envoyerNouveauLien}>
          <ChampTexte
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@restaurant.be"
            autoComplete="email"
            autoFocus
            required
          />
          <BoutonPrincipal type="submit" disabled={envoi || !email.trim()} style={{ marginTop: 8 }}>
            {envoi ? 'Envoi…' : 'Recevoir un nouveau lien'}
          </BoutonPrincipal>
        </form>

        {lienConnexion}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 11, color: C.gris, textDecoration: 'none' }}>
            ← Retour au site
          </Link>
        </div>
      </CarteAuth>
    </Ecran>
  )
}
