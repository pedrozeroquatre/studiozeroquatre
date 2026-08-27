'use client'
import { useState } from 'react'
import { getEspaceSupabase } from '@/lib/supabase-browser'
import { Ecran, CarteAuth, ChampTexte, Alerte, BoutonPrincipal, C } from './ui'

const MIN = 8

// Atterrissage du lien d'invitation (et de « mot de passe oublié »).
//
// Pedro ouvre un accès depuis l'OS, le client reçoit un mail, clique, et
// arrive ici avec une session déjà établie par le jeton du lien. Il ne reste
// qu'à lui faire choisir son mot de passe : aucun mot de passe n'est jamais
// généré ni transmis par mail.
export default function ChoixMotDePasse({ type, email, onTermine }) {
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const invitation = type !== 'recovery'

  async function soumettre(e) {
    e.preventDefault()
    if (envoi) return

    if (motDePasse.length < MIN) {
      setErreur(`Choisissez un mot de passe d'au moins ${MIN} caractères.`)
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.')
      return
    }

    setErreur('')
    setEnvoi(true)

    const sb = getEspaceSupabase()
    if (!sb) {
      setErreur("L'espace n'est pas configuré. Contactez le studio.")
      setEnvoi(false)
      return
    }

    const { error } = await sb.auth.updateUser({ password: motDePasse })

    if (error) {
      // Cas courant : le jeton du lien n'a pas ouvert de session (lien déjà
      // utilisé, ou ouvert dans un autre navigateur que celui du mail).
      const session = /session/i.test(error.message)
      setErreur(
        session
          ? "Ce lien n'est plus valable. Demandez-en un nouveau au studio."
          : error.message
      )
      setEnvoi(false)
      return
    }

    onTermine()
  }

  return (
    <Ecran>
      <CarteAuth
        titre={invitation ? 'Bienvenue' : 'Nouveau mot de passe'}
        intro={
          invitation
            ? 'Choisissez votre mot de passe pour accéder à votre espace. C’est lui qui vous servira à vous reconnecter.'
            : 'Choisissez votre nouveau mot de passe.'
        }
      >
        {email && (
          <div style={{ fontSize: 12, color: C.doux, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.trait}` }}>
            Compte : <span style={{ color: C.vif }}>{email}</span>
          </div>
        )}

        <form onSubmit={soumettre}>
          <ChampTexte
            label="Mot de passe"
            type="password"
            value={motDePasse}
            onChange={e => setMotDePasse(e.target.value)}
            placeholder={`${MIN} caractères minimum`}
            autoComplete="new-password"
            autoFocus
          />
          <ChampTexte
            label="Confirmez"
            type="password"
            value={confirmation}
            onChange={e => setConfirmation(e.target.value)}
            placeholder="Le même, pour être sûr"
            autoComplete="new-password"
          />

          {erreur && <Alerte>{erreur}</Alerte>}

          <BoutonPrincipal type="submit" disabled={envoi} style={{ marginTop: 8 }}>
            {envoi ? 'Enregistrement…' : 'Enregistrer et continuer'}
          </BoutonPrincipal>
        </form>
      </CarteAuth>
    </Ecran>
  )
}
