'use client'
import Link from 'next/link'
import { Ecran, CarteAuth, C } from './ui'

// Le lien d'invitation vit 24 h. Passé ce délai Supabase renvoie
// `#error=access_denied&error_code=otp_expired` : mieux vaut une explication
// qu'une page cassée ou un formulaire qui ne marchera jamais.
export default function LienExpire({ onConnexion }) {
  return (
    <Ecran>
      <CarteAuth
        titre="Ce lien a expiré"
        intro="Les liens d’accès ne sont valables que 24 heures, et ne servent qu’une fois."
      >
        <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8, marginBottom: 24 }}>
          Écrivez-nous à{' '}
          <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif, textDecoration: 'underline' }}>
            contact@studiozeroquatre.com
          </a>{' '}
          et nous vous renvoyons un lien tout de suite.
          <br />
          <br />
          Si vous avez déjà choisi votre mot de passe, connectez-vous simplement.
        </div>

        <button
          onClick={onConnexion}
          style={{ width: '100%', background: 'none', border: `1px solid ${C.trait2}`, color: C.texte, fontFamily: 'inherit', fontSize: 12, padding: 12, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.vif }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.trait2 }}
        >
          Aller à la connexion
        </button>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 11, color: C.gris, textDecoration: 'none' }}>
            ← Retour au site
          </Link>
        </div>
      </CarteAuth>
    </Ecran>
  )
}
