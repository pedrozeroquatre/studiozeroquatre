'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  getEspaceSupabase, espaceConfigure, lienExpire, lienChoixMotDePasse, LIEN,
} from '@/lib/supabase-browser'
import { chargerIdentite, chargerEspace } from '@/lib/espace-data'
import ChoixMotDePasse from '@/components/espace/ChoixMotDePasse'
import LienExpire from '@/components/espace/LienExpire'
import Connexion from '@/components/espace/Connexion'
import Espace from '@/components/espace/Espace'
import { Ecran, CarteAuth, C } from '@/components/espace/ui'

// Point d'entrée unique de l'espace client.
//
// C'est aussi l'adresse vers laquelle pointent les mails envoyés par l'OS
// (secret `URL_ESPACE_CLIENT` de la fonction `creer-acces-client`) : le jeton
// d'invitation atterrit ici, dans le fragment de l'URL.
//
// États possibles :
//   chargement     — on regarde s'il y a une session
//   non-configure  — les variables Supabase manquent
//   lien-expire    — lien d'invitation mort (24 h) ou déjà utilisé
//   mot-de-passe   — arrivée par mail : le client choisit son mot de passe
//   connexion      — email + mot de passe
//   sans-acces     — connecté, mais ce compte n'est pas un compte client
//   erreur         — la base a refusé la lecture
//   espace         — le tableau de bord
export default function EspacePage() {
  const [etat, setEtat] = useState('chargement')
  const [email, setEmail] = useState('')
  const [typeLien, setTypeLien] = useState(null)
  const [identite, setIdentite] = useState(null)
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')
  // 'succes' | 'annule' au retour de Stripe. Lu depuis l'URL, puis effacé :
  // un rechargement de page ne doit pas rejouer le message.
  const [paiement, setPaiement] = useState(null)

  // Compte déjà chargé, pour ne pas relancer les requêtes à chaque
  // rafraîchissement de jeton émis par supabase-js.
  const chargePour = useRef(null)
  // Miroir de `etat`, pour que l'abonnement onAuthStateChange puisse le
  // consulter sans être recréé à chaque changement d'écran.
  const etatRef = useRef('chargement')
  useEffect(() => { etatRef.current = etat }, [etat])

  const charger = useCallback(async () => {
    const sb = getEspaceSupabase()
    try {
      // getSession() est local (pas d'appel réseau) : il sert juste à savoir
      // pour quel compte on charge, et à ne pas recharger deux fois le même.
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { setEtat('connexion'); return }
      setEmail(session.user.email || '')

      const id = await chargerIdentite()

      // mon_client_id() à NULL : compte du studio, ou compte pas encore
      // rattaché. Toutes les vues seraient vides — mieux vaut le dire.
      if (!id.clientId) {
        chargePour.current = session.user.id
        setEtat('sans-acces')
        return
      }

      const data = await chargerEspace()
      setIdentite(id)
      setDonnees(data)
      chargePour.current = session.user.id
      setEtat('espace')
    } catch (e) {
      setErreur(e?.message || 'Erreur inconnue')
      setEtat('erreur')
    }
  }, [])

  useEffect(() => {
    if (!espaceConfigure()) { setEtat('non-configure'); return }

    const sb = getEspaceSupabase()
    let annule = false

    // Le fragment a fait son travail (supabase-js l'a consommé) ou porte une
    // erreur : dans les deux cas on le retire de la barre d'adresse, pour ne
    // pas laisser traîner un jeton dans l'historique du navigateur.
    const nettoyerURL = () => window.history.replaceState(null, '', window.location.pathname)

    const retour = new URLSearchParams(window.location.search).get('paiement')
    if (retour === 'succes' || retour === 'annule') {
      setPaiement(retour)
      nettoyerURL()
    }

    if (lienExpire()) {
      nettoyerURL()
      setEtat('lien-expire')
      return
    }

    ;(async () => {
      // getSession() attend la fin de l'initialisation : à ce moment le jeton
      // du lien a déjà été échangé contre une session.
      const { data: { session } } = await sb.auth.getSession()
      if (annule) return

      if (lienChoixMotDePasse()) {
        nettoyerURL()
        if (!session) {
          // Jeton présent mais aucune session : lien déjà utilisé, ou ouvert
          // dans un autre navigateur que celui qui a reçu le mail.
          setEtat('lien-expire')
          return
        }
        setEmail(session.user.email || '')
        setTypeLien(LIEN.type)
        setEtat('mot-de-passe')
        return
      }

      if (!session) { setEtat('connexion'); return }

      await charger()
    })()

    const { data: abonnement } = sb.auth.onAuthStateChange((evenement, session) => {
      if (annule) return

      if (evenement === 'SIGNED_OUT') {
        chargePour.current = null
        setDonnees(null)
        setIdentite(null)
        setEtat('connexion')
        return
      }

      if (evenement === 'SIGNED_IN' && session) {
        // Arrivée par un lien de mail : c'est detectSessionInUrl qui vient
        // d'émettre ce SIGNED_IN en échangeant le jeton. Le parcours est alors
        // piloté de bout en bout par l'effet ci-dessus puis par
        // ChoixMotDePasse — sans ce garde-fou, on filerait au tableau de bord
        // en sautant le choix du mot de passe.
        //
        // Le garde-fou est borné aux deux états du parcours : une fois passé à
        // 'connexion' ou 'espace', il ne doit plus rien bloquer, sinon une
        // reconnexion après déconnexion resterait sans effet (LIEN, lui, vaut
        // pour toute la durée de vie de la page).
        const parcoursInvitation = etatRef.current === 'chargement' || etatRef.current === 'mot-de-passe'
        if (parcoursInvitation && lienChoixMotDePasse()) return
        // Déjà chargé pour ce compte : supabase-js réémet SIGNED_IN à chaque
        // rafraîchissement de jeton, inutile de tout relire.
        if (chargePour.current === session.user.id) return
        setEtat('chargement')
        charger()
      }
    })

    return () => { annule = true; abonnement.subscription.unsubscribe() }
  }, [charger])

  async function seDeconnecter() {
    const sb = getEspaceSupabase()
    chargePour.current = null
    await sb?.auth.signOut()
    setDonnees(null)
    setIdentite(null)
    setEtat('connexion')
  }

  // useCallback obligatoire : Espace s'en sert dans un effet (relecture au
  // retour de Stripe). Une identité neuve à chaque rendu relancerait l'effet
  // en boucle.
  const recharger = useCallback(async () => {
    try {
      setDonnees(await chargerEspace())
    } catch {
      /* La commande est passée ; un rafraîchissement raté n'est pas bloquant. */
    }
  }, [])

  if (etat === 'chargement') {
    return (
      <Ecran>
        <div style={{ padding: '80px 20px', textAlign: 'center', fontSize: 12, color: C.pale }}>
          Chargement…
        </div>
      </Ecran>
    )
  }

  if (etat === 'non-configure') {
    return (
      <Ecran>
        <CarteAuth titre="Espace indisponible" intro="L’espace client n’est pas encore raccordé à la base.">
          <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8 }}>
            Écrivez-nous à{' '}
            <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif }}>contact@studiozeroquatre.com</a>,
            nous prenons votre commande directement.
          </div>
        </CarteAuth>
      </Ecran>
    )
  }

  if (etat === 'lien-expire') {
    return <LienExpire onConnexion={() => setEtat('connexion')} />
  }

  if (etat === 'mot-de-passe') {
    return (
      <ChoixMotDePasse
        type={typeLien}
        email={email}
        onTermine={() => { setEtat('chargement'); charger() }}
      />
    )
  }

  if (etat === 'sans-acces') {
    return (
      <Ecran>
        <CarteAuth
          titre="Aucun espace rattaché"
          intro="Ce compte est bien connecté, mais il n’est relié à aucun restaurant."
        >
          <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8, marginBottom: 24 }}>
            Si vous êtes client du studio, écrivez à{' '}
            <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif }}>contact@studiozeroquatre.com</a>
            {' '}pour qu’on rattache votre accès.
          </div>
          <button
            onClick={seDeconnecter}
            style={{ width: '100%', background: 'none', border: `1px solid ${C.trait2}`, color: C.texte, fontFamily: 'inherit', fontSize: 12, padding: 12, borderRadius: 3, cursor: 'pointer' }}
          >
            Se déconnecter
          </button>
        </CarteAuth>
      </Ecran>
    )
  }

  if (etat === 'erreur') {
    return (
      <Ecran>
        <CarteAuth titre="Données indisponibles" intro="Votre espace n’a pas pu être chargé.">
          <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.8, marginBottom: 20 }}>
            Réessayez dans un instant. Si cela persiste, écrivez à{' '}
            <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif }}>contact@studiozeroquatre.com</a>.
          </div>
          <div style={{ fontSize: 11, color: C.pale, background: '#000', border: `1px solid ${C.trait}`, borderRadius: 3, padding: 10, marginBottom: 20, wordBreak: 'break-word' }}>
            {erreur}
          </div>
          <button
            onClick={() => { setEtat('chargement'); charger() }}
            style={{ width: '100%', background: 'none', border: `1px solid ${C.trait2}`, color: C.texte, fontFamily: 'inherit', fontSize: 12, padding: 12, borderRadius: 3, cursor: 'pointer' }}
          >
            Réessayer
          </button>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: 11, color: C.gris, textDecoration: 'none' }}>← Retour au site</Link>
          </div>
        </CarteAuth>
      </Ecran>
    )
  }

  if (etat === 'espace' && donnees && identite) {
    return (
      <Espace
        donnees={donnees}
        identite={identite}
        email={email}
        paiement={paiement}
        onDeconnexion={seDeconnecter}
        onRecharger={recharger}
      />
    )
  }

  return <Connexion />
}
