'use client'
import { useState } from 'react'
import { consulterTva, enregistrerFacturation } from '@/lib/espace-data'
import { normaliserTva, formaterTva } from '@/lib/numero-tva'
import { Ecran, CarteAuth, ChampTexte, Alerte, BoutonPrincipal, BoutonFantome, C } from './ui'

// La fiche de facturation d'un restaurant.
//
// Le client ne tape que son numéro de TVA : VIES rend la raison sociale et
// l'adresse du siège, il confirme. Les factures partent par défaut à l'adresse
// de son compte — beaucoup préféreront celle de leur comptable, d'où le lien
// « une autre adresse ».
//
// VIES ne bloque jamais. Saisie manuelle quand VIES ne connaît pas le numéro
// (société en franchise de TVA, typiquement), masque l'adresse, ou ne répond
// pas — dans ce dernier cas le client peut d'abord réessayer. Quand VIES a
// tout, pas de saisie : une adresse officielle n'a pas à être retouchée, et
// c'est elle que la facture Peppol doit porter.
//
// Le studio revérifie chaque numéro après coup, côté serveur : ce qui n'a pas
// pu être confirmé ici est signalé à Pedro dans l'OS, sans rien demander au
// client.
//
// Étapes : 'numero' → 'confirmation' (VIES a tout) ou 'manuel' → enregistré.
export default function FicheFacturation({ fiche, position, total, email, compteGroupe, onTermine, onAnnuler, onDeconnexion }) {
  const [etape, setEtape] = useState('numero')
  const [tva, setTva] = useState(fiche.tva ? formaterTva(fiche.tva) : '')
  const [infos, setInfos] = useState({ societe: '', rue: '', cp: '', ville: '' })
  const [autreEmail, setAutreEmail] = useState(Boolean(fiche.email && fiche.email !== email))
  const [emailFacturation, setEmailFacturation] = useState(fiche.email && fiche.email !== email ? fiche.email : '')
  const [avertissement, setAvertissement] = useState('')
  const [indisponible, setIndisponible] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const majInfo = (cle, valeur) => setInfos(i => ({ ...i, [cle]: valeur }))

  // Ce que VIES a rendu, sinon ce que le studio avait déjà noté.
  const preRemplir = (r = {}) => setInfos({
    societe: r.societe || fiche.societe || '',
    rue: r.rue || fiche.rue || '',
    cp: r.cp || fiche.cp || '',
    ville: r.ville || fiche.ville || '',
  })

  function saisieManuelle(message) {
    const chiffres = normaliserTva(tva)
    if (chiffres) setTva(formaterTva(chiffres))
    preRemplir()
    setIndisponible(false)
    setErreur('')
    setAvertissement(message)
    setEtape('manuel')
  }

  async function verifier(e) {
    e?.preventDefault()
    if (envoi) return
    if (!normaliserTva(tva)) {
      setErreur('Ce numéro de TVA n’est pas valide. Il ressemble à BE 0123.456.789.')
      return
    }

    setErreur('')
    setIndisponible(false)
    setEnvoi(true)
    try {
      const r = await consulterTva(tva)
      if (r.statut === 'invalide') {
        setErreur('Ce numéro de TVA n’est pas valide. Il ressemble à BE 0123.456.789.')
      } else if (r.statut === 'indisponible') {
        // On reste sur le numéro : le client choisit entre réessayer et remplir.
        setIndisponible(true)
      } else {
        setTva(formaterTva(r.tva))
        preRemplir(r)
        if (r.statut === 'trouve') {
          setAvertissement('')
          setEtape('confirmation')
        } else {
          setAvertissement(
            r.statut === 'inconnu'
              ? 'Votre numéro n’apparaît pas dans le registre européen de TVA — c’est normal pour une société en franchise de TVA. Complétez vos informations, nous vérifierons de notre côté.'
              : 'Votre numéro est bien actif, mais le registre ne donne pas votre adresse. Complétez-la à la main.'
          )
          setEtape('manuel')
        }
      }
    } catch (err) {
      setErreur(err?.message || 'La vérification n’a pas pu se faire.')
    }
    setEnvoi(false)
  }

  async function enregistrer(e) {
    e.preventDefault()
    if (envoi) return

    if (etape === 'manuel') {
      if (!infos.societe.trim() || !infos.rue.trim() || !infos.ville.trim()) {
        setErreur('Complétez la raison sociale, l’adresse et la ville.')
        return
      }
      if (!/^\d{4}$/.test(infos.cp.trim())) {
        setErreur('Le code postal belge compte 4 chiffres.')
        return
      }
    }
    if (autreEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailFacturation.trim())) {
      setErreur('Cette adresse e-mail n’est pas valide.')
      return
    }

    setErreur('')
    setEnvoi(true)
    try {
      await enregistrerFacturation({
        ...infos,
        tva,
        email: autreEmail ? emailFacturation : null,
        etablissement: compteGroupe ? fiche.id : null,
      })
      onTermine()
    } catch (err) {
      setErreur(err?.message || 'L’enregistrement a échoué.')
      setEnvoi(false)
    }
  }

  const titre = total > 1 ? `Facturation — ${fiche.nom}` : 'Vos informations de facturation'
  const intro = etape === 'numero'
    ? 'Votre numéro de TVA suffit : nous retrouvons votre société et son adresse dans le registre européen.'
    : etape === 'confirmation'
      ? 'Voici ce que le registre européen de TVA indique. C’est bien vous ?'
      : null

  const actions = onDeconnexion && <BoutonFantome onClick={onDeconnexion}>Déconnexion</BoutonFantome>

  return (
    <Ecran actions={actions}>
      <CarteAuth titre={titre} intro={intro}>
        {total > 1 && (
          <div style={{ fontSize: 11, color: C.pale, marginTop: -16, marginBottom: 24 }}>
            Restaurant {position} sur {total}
          </div>
        )}

        {etape === 'numero' && (
          <form onSubmit={verifier}>
            <ChampTexte
              label="Numéro de TVA"
              value={tva}
              onChange={e => { setTva(e.target.value); setIndisponible(false) }}
              placeholder="BE 0123.456.789"
              autoComplete="off"
              autoFocus
            />
            {erreur && <Alerte>{erreur}</Alerte>}
            {indisponible && (
              <Alerte ton="info">
                Le service européen de vérification de TVA est temporairement indisponible. Réessayez dans un instant, ou remplissez vos informations à la main.
              </Alerte>
            )}
            <BoutonPrincipal type="submit" disabled={envoi || !tva.trim()} style={{ marginTop: 8 }}>
              {envoi ? 'Vérification…' : indisponible ? 'Réessayer' : 'Vérifier'}
            </BoutonPrincipal>
            {indisponible && !envoi && (
              <button
                type="button"
                onClick={() => saisieManuelle('Le registre européen de TVA ne répond pas : complétez vos informations, nous vérifierons de notre côté.')}
                style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: C.gris, fontFamily: 'inherit', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Remplir manuellement
              </button>
            )}
          </form>
        )}

        {etape !== 'numero' && (
          <form onSubmit={enregistrer}>
            {etape === 'confirmation' ? (
              <div style={{ fontSize: 13, color: C.texte, lineHeight: 1.8, background: '#000', border: `1px solid ${C.trait2}`, borderRadius: 3, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ color: C.vif, fontWeight: 500 }}>{infos.societe}</div>
                <div>{infos.rue}</div>
                <div>{infos.cp} {infos.ville}</div>
                <div style={{ color: C.doux, marginTop: 6 }}>{tva}</div>
              </div>
            ) : (
              <>
                {avertissement && <Alerte ton="info">{avertissement}</Alerte>}
                <div style={{ fontSize: 12, color: C.doux, marginBottom: 16 }}>TVA : <span style={{ color: C.vif }}>{tva}</span></div>
                <ChampTexte label="Raison sociale" value={infos.societe} onChange={e => majInfo('societe', e.target.value)} placeholder="SRL Exemple" maxLength={200} />
                <ChampTexte label="Rue et numéro" value={infos.rue} onChange={e => majInfo('rue', e.target.value)} placeholder="Rue de l’Exemple 12" maxLength={200} />
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                  <ChampTexte label="Code postal" value={infos.cp} onChange={e => majInfo('cp', e.target.value)} placeholder="1000" inputMode="numeric" maxLength={4} />
                  <ChampTexte label="Ville" value={infos.ville} onChange={e => majInfo('ville', e.target.value)} placeholder="Bruxelles" maxLength={120} />
                </div>
              </>
            )}

            <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.7, marginBottom: 16 }}>
              {autreEmail ? (
                <ChampTexte
                  label="E-mail pour les factures"
                  type="email"
                  value={emailFacturation}
                  onChange={e => setEmailFacturation(e.target.value)}
                  placeholder="compta@exemple.be"
                  autoComplete="email"
                />
              ) : (
                <>
                  Factures envoyées à <span style={{ color: C.vif }}>{email}</span>
                  <br />
                </>
              )}
              <button
                type="button"
                onClick={() => setAutreEmail(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0, color: C.gris, fontFamily: 'inherit', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
              >
                {autreEmail ? `Utiliser ${email}` : 'Envoyer les factures à une autre adresse'}
              </button>
            </div>

            {erreur && <Alerte>{erreur}</Alerte>}

            <BoutonPrincipal type="submit" disabled={envoi} style={{ marginTop: 8 }}>
              {envoi ? 'Enregistrement…' : etape === 'confirmation' ? 'Oui, c’est bien nous' : 'Enregistrer'}
            </BoutonPrincipal>
            <button
              type="button"
              onClick={() => { setEtape('numero'); setErreur('') }}
              style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: C.gris, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}
            >
              {etape === 'confirmation' ? 'Ce n’est pas ma société — changer de numéro' : '← Changer de numéro'}
            </button>
          </form>
        )}

        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            style={{ width: '100%', marginTop: 20, paddingTop: 16, background: 'none', border: 'none', borderTop: `1px solid ${C.trait}`, color: C.pale, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}
          >
            Annuler
          </button>
        )}
      </CarteAuth>
    </Ecran>
  )
}
