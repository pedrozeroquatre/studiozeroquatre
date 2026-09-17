'use client'
import { useState } from 'react'
import {
  ouvrirPaiement, verifierLignes, formatNombre, formatEuros,
  formatPrixUnitaire, montant, BOITES_PAR_PAQUET,
} from '@/lib/espace-data'
import { TVA_TAUX, tvaSur, avecTva, prixUnitaireTtc, somme } from '@/lib/tva'
import { cleCreneau, estCreneau } from '@/lib/creneaux'
import Calendrier from './Calendrier'
import Creneaux from './Creneaux'
import { C, S, MONO, SYNE, focus, Label, Alerte, BoutonPrincipal, Pastille } from './ui'

const RAPIDE = [500, 1000, 2000]

// Formulaire de commande — la seule écriture autorisée au client, via le
// paiement Stripe puis l'Edge Function (cf. NOTES-ESPACE-CLIENT.md).
//
// Le tarif vient de la base en HTVA, mais TOUT ce qui est affiché ici est TTC :
// le restaurateur doit lire le montant qu'il va réellement payer, et c'est ce
// montant-là que porte le bouton. Le HTVA reste écrit à côté, en petit.
export default function Commander({
  references,
  etablissements,
  etablissementImpose,   // id du restaurant quand le compte y est rattaché ; null pour un compte groupe
  prefill,               // { reference: quantite } — la dernière commande
  numeroConfirme,        // numéro de la commande qu'on vient de passer, une fois les données relues
  tarif,                 // prix unitaire HTVA, identique à tous les formats — null si la vue n'existe pas
  joursComplets,         // dates où la tournée est pleine (4 livraisons)
  creneauxPris,          // créneaux d'une heure déjà réservés — null si la vue n'existe pas
  onCommandePassee,
}) {
  const [quantites, setQuantites] = useState(() => prefill || {})
  const [souhaitee, setSouhaitee] = useState('')
  // '' = dans la journée. C'est le défaut, et choisir une heure reste facultatif.
  const [heure, setHeure] = useState('')
  const [note, setNote] = useState('')
  // Un compte groupe doit choisir son restaurant — sauf s'il n'en a qu'un,
  // auquel cas le choix est évident et on le pose d'office. Sans ça, aucun
  // sélecteur ne s'affiche et la commande part sans établissement, que la base
  // refuse.
  const [etablissement, setEtablissement] = useState(
    etablissementImpose || (etablissements.length === 1 ? etablissements[0].id : '')
  )
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(null)

  // Un compte « groupe » voit plusieurs restaurants : il doit dire pour lequel
  // il commande. Un compte rattaché n'a pas ce choix (la base l'impose).
  const choixEtablissement = !etablissementImpose && etablissements.length > 1

  // Aucun restaurant rattaché : la base refusera la commande (elle a besoin de
  // savoir où livrer) et il n'y a rien à choisir. On le dit franchement plutôt
  // que de laisser le client buter sur le bouton.
  const sansEtablissement = !etablissementImpose && etablissements.length === 0

  const lignes = references
    .map(ref => ({ reference: ref, quantite: parseInt(quantites[ref] || 0, 10) }))
    .filter(l => Number.isFinite(l.quantite) && l.quantite > 0)

  const totalBoites = lignes.reduce((s, l) => s + l.quantite, 0)

  // Un seul prix pour tous les formats : chaque ligne vaut sa quantité fois ce
  // prix. 300 × 33×33 et 500 × 30×30 au même tarif, c'est 800 boîtes — la
  // taille ne change rien au calcul.
  //
  // On chiffre ligne par ligne, et pas en une fois sur le total des boîtes :
  // c'est ainsi que Stripe facture (une ligne par format) et qu'il calcule la
  // TVA. Arrondir le total d'un coup afficherait parfois un centime de moins
  // que ce qui est débité.
  const chiffrees = tarif
    ? lignes.map(l => ({ ...l, htva: montant(l.quantite, tarif) }))
    : []
  const totalHtva = tarif ? somme(chiffrees.map(l => l.htva)) : null
  const totalTva = tarif ? somme(chiffrees.map(l => tvaSur(l.htva))) : null
  const totalTtc = tarif ? somme([totalHtva, totalTva]) : null

  // Sans tarif enregistré, on ne peut rien facturer — et on ne se rabat plus
  // sur une demande sans paiement : elle créait une commande qui n'apparaissait
  // dans AUCUN écran du studio, donc que personne ne traitait. Mieux vaut dire
  // au client que quelque chose manque de notre côté (écran de garde plus bas)
  // que d'accepter une commande qui ne sera jamais vue.
  const sansTarif = !tarif

  function setLigne(ref, n) {
    setQuantites(q => ({ ...q, [ref]: String(n) }))
  }

  async function valider() {
    setErreur('')

    const probleme = verifierLignes(lignes)
    if (probleme) { setErreur(probleme); return }

    if (choixEtablissement && !etablissement) {
      setErreur('Choisissez le restaurant à livrer.')
      return
    }

    if (!souhaitee) {
      setErreur('Choisissez la date à laquelle vous voulez être livré.')
      return
    }

    // L'heure est facultative — mais si une est posée, elle doit être un vrai
    // créneau et être encore libre. Le cas arrive sans mauvaise foi : le client
    // laisse l'écran ouvert, un autre réserve le créneau entre-temps.
    if (heure && !estCreneau(heure)) {
      setErreur('Cette heure de livraison n’est pas proposée.')
      return
    }
    if (heure && (creneauxPris || []).some(c => cleCreneau(c.date, c.heure) === cleCreneau(souhaitee, heure))) {
      setErreur('Ce créneau vient d’être réservé. Choisissez-en un autre.')
      return
    }

    // La commande et la livraison ne sont écrites qu'après Stripe, par
    // l'Edge Function. Ici on ne fait qu'ouvrir le paiement.
    setEnvoi(true)
    try {
      const url = await ouvrirPaiement({
        lignes,
        date: souhaitee,
        heure: heure || null,
        note,
        etablissement: etablissementImpose || etablissement || null,
      })
      // On laisse `envoi` à true : la page part sur Stripe, la relâcher
      // ferait clignoter le bouton pendant la redirection.
      window.location.href = url
    } catch (e) {
      setErreur(e?.message || 'Le paiement n’a pas pu être ouvert.')
      setEnvoi(false)
    }
  }

  if (sansTarif) {
    return (
      <div id="commander" style={{ ...S.carte, textAlign: 'center', padding: 32 }}>
        <div style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: C.texte, marginBottom: 10 }}>
          Commande indisponible
        </div>
        <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
          Votre tarif n’est pas encore enregistré de notre côté, nous ne pouvons
          donc pas calculer le montant de votre commande. Écrivez-nous à{' '}
          <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif }}>
            contact@studiozeroquatre.com
          </a>{' '}
          et nous le mettons en place tout de suite.
        </div>
      </div>
    )
  }

  if (sansEtablissement) {
    return (
      <div id="commander" style={{ ...S.carte, textAlign: 'center', padding: 32 }}>
        <div style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: C.texte, marginBottom: 10 }}>
          Commande indisponible
        </div>
        <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
          Aucun restaurant n’est encore rattaché à votre compte, nous ne saurions
          pas où livrer. Écrivez-nous à{' '}
          <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.vif }}>
            contact@studiozeroquatre.com
          </a>{' '}
          et nous le rattachons tout de suite.
        </div>
      </div>
    )
  }

  if (succes) {
    return (
      <div id="commander" style={{ ...S.carte, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, color: C.vif, marginBottom: 16 }}>✓</div>
        <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.vif, marginBottom: 12 }}>
          Commande envoyée
        </div>
        <div style={{ fontSize: 13, color: C.doux, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 20px' }}>
          Le studio l’a reçue et revient vers vous pour confirmer la date de livraison.
        </div>
        {numeroConfirme && (
          <div style={{ display: 'inline-block', background: '#000', border: `1px solid ${C.trait2}`, borderRadius: 3, padding: '10px 20px', fontSize: 13, color: C.vif, letterSpacing: 2, marginBottom: 20 }}>
            {numeroConfirme}
          </div>
        )}
        <div style={{ fontSize: 12, color: C.gris, marginBottom: 28 }}>
          {succes.lignes.map(l => `${l.reference} × ${formatNombre(l.quantite)}`).join('   ·   ')}
        </div>
        <button
          onClick={() => setSucces(null)}
          style={{ background: 'none', border: `1px solid ${C.trait2}`, color: C.texte, fontFamily: 'inherit', fontSize: 12, padding: '10px 24px', borderRadius: 3, cursor: 'pointer' }}
        >
          Passer une autre commande
        </button>
      </div>
    )
  }

  return (
    <div id="commander" style={S.carte}>
      <Label>Vos formats</Label>

      {tarif && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.trait}` }}>
          <span style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.vif }}>
            {formatPrixUnitaire(prixUnitaireTtc(tarif))}
          </span>
          <span style={{ fontSize: 12, color: C.doux }}>
            par boîte, TVA comprise
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Format', 'Quantité (boîtes)', 'Soit', ...(tarif ? ['Sous-total TTC'] : [])].map((h, i) => (
                <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: C.pale, textAlign: i >= 2 ? 'right' : 'left', padding: '8px 12px', borderBottom: `1px solid ${C.trait2}`, fontWeight: 400, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {references.map(ref => {
              const qte = parseInt(quantites[ref] || 0, 10) || 0
              return (
                <tr key={ref} style={{ borderBottom: `1px solid ${C.trait}` }}>
                  <td style={{ padding: 12, verticalAlign: 'middle' }}><Pastille>{ref}</Pastille></td>
                  <td style={{ padding: 12, verticalAlign: 'middle' }}>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={quantites[ref] ?? ''}
                      onChange={e => setQuantites(q => ({ ...q, [ref]: e.target.value }))}
                      placeholder="0"
                      aria-label={`Quantité de boîtes ${ref}`}
                      style={{ background: C.champ, border: `1px solid ${C.trait2}`, borderRadius: 3, color: C.texte, fontFamily: MONO, fontSize: 13, padding: '7px 10px', width: 100, textAlign: 'right', outline: 'none', transition: 'border-color 0.15s' }}
                      {...focus}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {RAPIDE.map(n => (
                        <button
                          key={n}
                          onClick={() => setLigne(ref, n)}
                          style={{ background: 'none', border: '1px solid #222', color: C.gris, fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.vif; e.currentTarget.style.color = C.vif }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = C.gris }}
                        >
                          {n.toLocaleString('fr-BE')}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, textAlign: 'right', verticalAlign: 'middle', color: qte > 0 ? C.gris : C.pale, whiteSpace: 'nowrap' }}>
                    {qte > 0 ? `${formatNombre(Math.round(qte / BOITES_PAR_PAQUET))} paquets` : '—'}
                  </td>
                  {tarif && (
                    <td style={{ padding: 12, fontSize: 13, textAlign: 'right', verticalAlign: 'middle', color: qte > 0 ? C.vif : C.pale, whiteSpace: 'nowrap' }}>
                      {qte > 0 ? formatEuros(avecTva(montant(qte, tarif))) : '—'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {choixEtablissement && (
        <div style={{ marginBottom: 20 }}>
          <Label>Restaurant à livrer</Label>
          <select
            value={etablissement}
            onChange={e => setEtablissement(e.target.value)}
            style={{ ...S.champ, colorScheme: 'dark' }}
            {...focus}
          >
            <option value="">Choisir…</option>
            {etablissements.map(e => (
              <option key={e.id} value={e.id}>{e.nom}{e.societe ? ` — ${e.societe}` : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <Calendrier
          valeur={souhaitee}
          onChange={date => { setSouhaitee(date); setHeure('') }}
          joursComplets={joursComplets}
        />
        <Creneaux
          date={souhaitee}
          heure={heure}
          onChange={setHeure}
          creneauxPris={creneauxPris}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label>Note (optionnel)</Label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Réassort mensuel, livraison le matin…"
          style={{ ...S.champ, background: C.carte, fontSize: 12, padding: 12, resize: 'vertical', minHeight: 70, lineHeight: 1.6 }}
          {...focus}
        />
      </div>

      {erreur && <Alerte>{erreur}</Alerte>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${C.trait2}` }}>
        <div style={{ fontSize: 12, color: C.doux }}>
          {totalBoites === 0 ? 'Aucune quantité saisie' : (
            <>
              <span style={{ color: C.vif }}>{formatNombre(totalBoites)} boîtes</span>
              {totalTtc !== null && (
                <>
                  <div style={{ fontFamily: SYNE, fontSize: 24, fontWeight: 800, color: C.vif, marginTop: 4 }}>
                    {formatEuros(totalTtc)}
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: C.gris, marginLeft: 8 }}>TTC</span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.pale, marginTop: 3 }}>
                    {formatEuros(totalHtva)} HTVA + {formatEuros(totalTva)} de TVA ({TVA_TAUX} %)
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <BoutonPrincipal
          onClick={valider}
          disabled={totalBoites === 0 || envoi || !souhaitee}
          style={{ width: 'auto', padding: '12px 32px' }}
        >
          {envoi ? 'Redirection…' : `Payer ${formatEuros(totalTtc)}`}
        </BoutonPrincipal>
      </div>

      <div style={{ fontSize: 11, color: C.pale, lineHeight: 1.7, marginTop: 14 }}>
        Paiement sécurisé par Stripe. Votre livraison est réservée à la date
        choisie dès que le paiement est confirmé.
      </div>
    </div>
  )
}
