'use client'
import { useState } from 'react'
import {
  passerCommande, ouvrirPaiement, verifierLignes, formatNombre, formatEuros,
  formatPrixUnitaire, montant, BOITES_PAR_PAQUET,
} from '@/lib/espace-data'
import Calendrier from './Calendrier'
import { C, S, MONO, SYNE, focus, Label, Alerte, BoutonPrincipal, Pastille } from './ui'

const RAPIDE = [500, 1000, 2000]

// Formulaire de commande — la seule écriture autorisée au client, via la
// fonction `passer_commande()`. Aucun prix n'apparaît ici : les tarifs sont
// des données internes du studio, aucune vue ne les expose, et le paiement
// n'est pas encore relié à la commande (cf. NOTES-ESPACE-CLIENT.md).
export default function Commander({
  references,
  etablissements,
  etablissementImpose,   // id du restaurant quand le compte y est rattaché ; null pour un compte groupe
  prefill,               // { reference: quantite } — la dernière commande
  numeroConfirme,        // numéro de la commande qu'on vient de passer, une fois les données relues
  tarif,                 // prix unitaire HTVA, identique à tous les formats — null si la vue n'existe pas
  joursComplets,         // dates où la tournée est pleine (4 livraisons)
  onCommandePassee,
}) {
  const [quantites, setQuantites] = useState(() => prefill || {})
  const [souhaitee, setSouhaitee] = useState('')
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
  // Un seul prix pour tous les formats : le total, c'est le nombre total de
  // boîtes multiplié par ce prix. 300 × 33×33 et 500 × 30×30 au même tarif,
  // c'est 800 boîtes — la taille ne change rien au calcul.
  const totalEuros = tarif ? montant(totalBoites, tarif) : null

  // Tant qu'aucun tarif n'est enregistré, on ne peut pas facturer : l'espace
  // retombe alors sur l'envoi d'une demande, sans paiement. Dès que la vue
  // `portail_mon_tarif` existe, le parcours passe par Stripe.
  const paiement = Boolean(tarif)

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

    // Parcours payé : la commande et la livraison ne sont écrites qu'après
    // Stripe, par l'Edge Function. Ici on ne fait qu'ouvrir le paiement.
    if (paiement) {
      if (!souhaitee) {
        setErreur('Choisissez la date à laquelle vous voulez être livré.')
        return
      }
      setEnvoi(true)
      try {
        const url = await ouvrirPaiement({
          lignes,
          date: souhaitee,
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
      return
    }

    setEnvoi(true)
    try {
      const resultat = await passerCommande({
        souhaitee: souhaitee || null,
        note,
        lignes,
        etablissement: etablissementImpose || etablissement || null,
      })
      // passer_commande() renvoie l'uuid de la commande créée. Le numéro
      // lisible (CMD-2026-0042) est fabriqué côté base : il arrive avec la
      // relecture des données, et s'affiche dès qu'il est là.
      const id = typeof resultat === 'string' ? resultat : null
      setSucces({ lignes })
      setQuantites({})
      setNote('')
      setSouhaitee('')
      onCommandePassee?.(id)
    } catch (e) {
      // La base impose ses propres limites (50 lignes, 20 commandes / 24 h…) :
      // son message est plus juste que tout ce qu'on pourrait deviner ici.
      setErreur(e?.message || 'La commande n’a pas pu être enregistrée. Réessayez.')
    } finally {
      setEnvoi(false)
    }
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
            {formatPrixUnitaire(tarif)}
          </span>
          <span style={{ fontSize: 12, color: C.doux }}>
            par boîte, HTVA — le même prix pour tous vos formats.
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Format', 'Quantité (boîtes)', 'Soit', ...(tarif ? ['Sous-total'] : [])].map((h, i) => (
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
                      {qte > 0 ? formatEuros(montant(qte, tarif)) : '—'}
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
          onChange={setSouhaitee}
          joursComplets={joursComplets}
        />
        {!paiement && (
          <div style={{ fontSize: 11, color: C.pale, marginTop: 8 }}>
            Facultatif — le studio confirmera la date avec vous.
          </div>
        )}
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
              {totalEuros !== null && (
                <div style={{ fontFamily: SYNE, fontSize: 24, fontWeight: 800, color: C.vif, marginTop: 4 }}>
                  {formatEuros(totalEuros)}
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: C.gris, marginLeft: 8 }}>HTVA</span>
                </div>
              )}
            </>
          )}
        </div>
        <BoutonPrincipal
          onClick={valider}
          disabled={totalBoites === 0 || envoi || (paiement && !souhaitee)}
          style={{ width: 'auto', padding: '12px 32px' }}
        >
          {envoi
            ? (paiement ? 'Redirection…' : 'Envoi…')
            : paiement
              ? `Payer ${formatEuros(totalEuros)}`
              : 'Envoyer la commande'}
        </BoutonPrincipal>
      </div>

      <div style={{ fontSize: 11, color: C.pale, lineHeight: 1.7, marginTop: 14 }}>
        {paiement
          ? 'Paiement sécurisé par Stripe. Votre livraison est réservée à la date choisie dès que le paiement est confirmé.'
          : 'Le studio confirme la date et le montant avant la livraison. Rien n’est débité à cette étape.'}
      </div>
    </div>
  )
}
