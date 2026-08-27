'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getEspaceSupabase } from '@/lib/supabase-browser'
import { Ecran, CarteAuth, ChampTexte, Alerte, BoutonPrincipal, C } from './ui'

// Connexion par email + mot de passe (comptes Supabase créés depuis l'OS —
// les inscriptions publiques sont fermées, on n'expose donc aucun « créer un
// compte »).
export default function Connexion({ messageInitial }) {
  const [mode, setMode] = useState('connexion') // 'connexion' | 'oubli' | 'oubli-envoye'
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(messageInitial || '')
  const [envoi, setEnvoi] = useState(false)

  async function seConnecter(e) {
    e.preventDefault()
    if (envoi) return
    setErreur('')
    setEnvoi(true)

    const sb = getEspaceSupabase()
    if (!sb) {
      setErreur("L'espace n'est pas configuré. Contactez le studio.")
      setEnvoi(false)
      return
    }

    const { error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: motDePasse,
    })

    if (error) {
      // Message unique quelle que soit la cause : dire « cette adresse n'existe
      // pas » permettrait de deviner qui est client du studio.
      setErreur('Email ou mot de passe incorrect.')
      setEnvoi(false)
      return
    }
    // La session est posée : app/espace/page.js réagit via onAuthStateChange.
  }

  async function envoyerLienReinitialisation(e) {
    e.preventDefault()
    if (envoi) return
    setErreur('')
    setEnvoi(true)

    const sb = getEspaceSupabase()
    if (sb && email.trim()) {
      // Le résultat est volontairement ignoré : afficher « adresse inconnue »
      // transformerait ce formulaire en annuaire des clients du studio.
      await sb.auth
        .resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/espace`,
        })
        .catch(() => {})
    }

    setMode('oubli-envoye')
    setEnvoi(false)
  }

  const retour = (
    <Link
      href="/"
      style={{ background: 'none', border: `1px solid ${C.trait2}`, color: C.gris, fontFamily: 'inherit', fontSize: 11, padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, textDecoration: 'none', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.trait2; e.currentTarget.style.color = C.gris }}
    >
      ← Retour
    </Link>
  )

  if (mode === 'oubli-envoye') {
    return (
      <Ecran actions={retour}>
        <CarteAuth titre="Vérifiez vos mails">
          <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8 }}>
            Si un compte existe pour cette adresse, un lien de réinitialisation vient
            d’être envoyé. Il est valable 24 heures.
            <br />
            <br />
            Pensez à regarder dans les indésirables.
          </div>
          <button
            onClick={() => { setMode('connexion'); setMotDePasse('') }}
            style={{ width: '100%', marginTop: 24, background: 'none', border: `1px solid ${C.trait2}`, color: C.texte, fontFamily: 'inherit', fontSize: 12, padding: 12, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.vif }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.trait2 }}
          >
            Retour à la connexion
          </button>
        </CarteAuth>
      </Ecran>
    )
  }

  if (mode === 'oubli') {
    return (
      <Ecran actions={retour}>
        <CarteAuth
          titre="Mot de passe oublié"
          intro="Indiquez l’adresse à laquelle vous recevez nos mails, nous vous envoyons un lien pour en choisir un nouveau."
        >
          <form onSubmit={envoyerLienReinitialisation}>
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
              {envoi ? 'Envoi…' : 'Envoyer le lien'}
            </BoutonPrincipal>
          </form>
          <button
            onClick={() => setMode('connexion')}
            style={{ display: 'block', margin: '20px auto 0', background: 'none', border: 'none', color: C.gris, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Retour à la connexion
          </button>
        </CarteAuth>
      </Ecran>
    )
  }

  return (
    <Ecran actions={retour}>
      <CarteAuth titre="Espace clients" intro="Connectez-vous pour voir votre stock, vos livraisons et recommander.">
        <form onSubmit={seConnecter}>
          <ChampTexte
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@restaurant.be"
            autoComplete="email"
            required
          />
          <ChampTexte
            label="Mot de passe"
            type="password"
            value={motDePasse}
            onChange={e => setMotDePasse(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {erreur && <Alerte>{erreur}</Alerte>}

          <BoutonPrincipal type="submit" disabled={envoi || !email.trim() || !motDePasse} style={{ marginTop: 8 }}>
            {envoi ? 'Connexion…' : 'Accéder'}
          </BoutonPrincipal>
        </form>

        <button
          onClick={() => { setMode('oubli'); setErreur('') }}
          style={{ display: 'block', margin: '20px auto 0', background: 'none', border: 'none', color: C.gris, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Mot de passe oublié ?
        </button>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.trait}`, fontSize: 11, color: C.pale, lineHeight: 1.7, textAlign: 'center' }}>
          Pas encore d’accès ? Écrivez à{' '}
          <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.gris }}>
            contact@studiozeroquatre.com
          </a>
        </div>
      </CarteAuth>
    </Ecran>
  )
}
