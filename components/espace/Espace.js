'use client'
import { useEffect, useMemo, useState } from 'react'
import Commander from './Commander'
import {
  formatDate, formatDateLongue, formatNombre, formatEuros, joursRestants,
  grouperPar, texteProduits, FORMATS_STUDIO,
} from '@/lib/espace-data'
import {
  Ecran, C, S, SYNE, Label, Section, Tableau, TD, Statut,
  BoutonPrincipal, BoutonFantome, Vide,
} from './ui'

// Les vues exposent l'établissement par son NOM (`e.nom as etablissement`),
// alors que le sélecteur et passer_commande() travaillent avec son id.
function correspond(valeur, etab) {
  if (!etab) return true
  return valeur === etab.nom
}

function nommer(valeur) {
  return valeur || '—'
}

function CarteBloc({ titre, children, style }) {
  return (
    <div style={{ ...S.carte, display: 'flex', flexDirection: 'column', ...style }}>
      <Label>{titre}</Label>
      {children}
    </div>
  )
}

// ── Prochaine livraison ─────────────────────────────────────────────────────
function ProchaineLivraison({ livraisons, lignes, etablissements }) {
  const attendues = livraisons
    .filter(l => !l.livre && l.date_livraison)
    .sort((a, b) => new Date(a.date_livraison) - new Date(b.date_livraison))

  const prochaine = attendues[0]

  if (!prochaine) {
    const derniere = livraisons.find(l => l.livre)
    return (
      <Vide>
        Aucune livraison programmée pour le moment.
        {derniere && <><br />Dernière livraison le {formatDate(derniere.date_livraison)}.</>}
        <br />
        <br />
        Passez commande ci-dessous et le studio vous recontacte pour la date.
      </Vide>
    )
  }

  const jours = joursRestants(prochaine.date_livraison)
  const detail = (lignes.get(prochaine.id) || [])
    .map(l => `${l.taille} × ${formatNombre(l.quantite)}`)
    .join('   ·   ')

  return (
    <div>
      <div style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 800, color: C.vif, textTransform: 'capitalize', lineHeight: 1.2 }}>
        {formatDateLongue(prochaine.date_livraison)}
      </div>

      {jours !== null && (
        <div style={{ fontSize: 12, color: jours <= 2 ? C.accent : C.doux, marginTop: 6 }}>
          {jours < 0 ? `attendue depuis ${-jours} jour${-jours > 1 ? 's' : ''}`
            : jours === 0 ? 'aujourd’hui'
            : jours === 1 ? 'demain'
            : `dans ${jours} jours`}
        </div>
      )}

      <div style={{ fontSize: 12, color: C.gris, marginTop: 14, lineHeight: 1.7 }}>
        {detail || texteProduits(prochaine.produits) || '—'}
        <br />
        <span style={{ color: C.pale }}>{nommer(prochaine.etablissement)}</span>
      </div>

      {attendues.length > 1 && (
        <div style={{ fontSize: 11, color: C.pale, marginTop: 12 }}>
          + {attendues.length - 1} autre{attendues.length > 2 ? 's' : ''} livraison{attendues.length > 2 ? 's' : ''} prévue{attendues.length > 2 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ── L'espace ────────────────────────────────────────────────────────────────
export default function Espace({ donnees, identite, email, paiement, onDeconnexion, onRecharger }) {
  const {
    profil, etablissements, livraisons, lignesLivraison,
    stocks, documents, commandes, lignesCommande, tarif, joursComplets,
  } = donnees

  const [etabActif, setEtabActif] = useState(null) // null = tous
  const [prefill, setPrefill] = useState(null)
  const [cleFormulaire, setCleFormulaire] = useState(0)
  // passer_commande() ne renvoie qu'un uuid ; le numéro lisible se récupère
  // dans les données relues juste après.
  const [idConfirme, setIdConfirme] = useState(null)

  // Retour de Stripe : le paiement est confirmé côté Stripe, mais c'est
  // l'Edge Function qui écrit la commande et la livraison, prévenue par un
  // webhook qui arrive une seconde ou deux plus tard. On relit donc tout de
  // suite, puis une seconde fois, le temps que l'écriture aboutisse.
  useEffect(() => {
    if (paiement !== 'succes') return
    onRecharger()
    const t = setTimeout(onRecharger, 4000)
    return () => clearTimeout(t)
  }, [paiement, onRecharger])

  const moi = profil[0] || {}

  // Un compte rattaché à un restaurant ne voit que le sien : pas de sélecteur.
  const compteGroupe = !identite.etablissementId && etablissements.length > 1
  const etab = compteGroupe ? etablissements.find(e => e.id === etabActif) || null : null

  // Le stock n'est plus affiché, mais il reste la source des formats que ce
  // restaurant commande réellement (portail_mes_stocks.reference).
  const stocksVus = useMemo(() => stocks.filter(s => correspond(s.etablissement, etab)), [stocks, etab])
  const livraisonsVues = useMemo(() => livraisons.filter(l => correspond(l.etablissement, etab)), [livraisons, etab])
  const commandesVues = useMemo(() => commandes.filter(c => correspond(c.etablissement, etab)), [commandes, etab])

  const parLivraison = useMemo(() => grouperPar(lignesLivraison, 'livraison_id'), [lignesLivraison])
  const parCommande = useMemo(() => grouperPar(lignesCommande, 'commande_id'), [lignesCommande])

  // Les références réellement suivies pour ce restaurant. Si le stock est
  // encore vide (nouveau client), on propose les quatre formats du studio.
  const references = useMemo(() => {
    const vues = [...new Set(stocksVus.map(s => s.reference).filter(Boolean))]
    return vues.length ? vues : FORMATS_STUDIO
  }, [stocksVus])

  // Dernière commande, pour le bouton « Recommander ».
  const derniere = commandesVues[0] || null
  // Limitée aux formats encore suivis : une référence abandonnée depuis
  // resterait affichée dans le bandeau, puis serait silencieusement ignorée
  // par le formulaire, qui ne connaît que `references`.
  const quantitesDerniere = useMemo(() => {
    if (!derniere) return null
    const lignes = (parCommande.get(derniere.id) || []).filter(l => references.includes(l.reference))
    if (!lignes.length) return null
    return Object.fromEntries(lignes.map(l => [l.reference, String(l.quantite)]))
  }, [derniere, parCommande, references])

  async function commandePassee(id) {
    setIdConfirme(id)
    await onRecharger()
  }

  function recommander() {
    if (quantitesDerniere) setPrefill(quantitesDerniere)
    setCleFormulaire(k => k + 1)
    requestAnimationFrame(() => {
      document.getElementById('commander')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const titreEtab = moi.etablissement || (etab ? etab.nom : null)

  return (
    <Ecran>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {paiement === 'succes' && (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 800, color: '#4ade80', marginBottom: 6 }}>
              Paiement confirmé
            </div>
            <div style={{ fontSize: 12, color: C.doux, lineHeight: 1.7 }}>
              Votre livraison est réservée. Elle apparaît ci-dessous dans « Prochaine
              livraison » — laissez-nous quelques secondes si elle n’y est pas encore.
            </div>
          </div>
        )}

        {paiement === 'annule' && (
          <div style={{ background: 'rgba(255,107,53,0.08)', border: `1px solid ${C.accent}55`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.7 }}>
              Paiement annulé — rien n’a été débité, et aucune commande n’a été
              enregistrée. Vous pouvez recommencer quand vous voulez.
            </div>
          </div>
        )}

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.trait}`, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Label style={{ marginBottom: 8 }}>Votre espace</Label>
            <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 700, color: C.texte }}>
              Bonjour, <span style={{ color: C.vif }}>{moi.nom || 'bienvenue'}</span>
            </div>
            {(titreEtab || moi.societe) && (
              <div style={{ fontSize: 12, color: C.gris, marginTop: 6 }}>
                {[titreEtab, moi.societe].filter(Boolean).join(' — ')}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <BoutonFantome onClick={onDeconnexion}>Déconnexion</BoutonFantome>
            {email && <div style={{ fontSize: 10, color: C.pale, marginTop: 8 }}>{email}</div>}
          </div>
        </div>

        {/* Sélecteur d'établissement — comptes « groupe » seulement */}
        {compteGroupe && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
            {[{ id: null, nom: 'Tous' }, ...etablissements].map(e => {
              const actif = etabActif === e.id
              return (
                <button
                  key={e.id ?? 'tous'}
                  onClick={() => setEtabActif(e.id)}
                  style={{ background: actif ? C.vif : 'none', color: actif ? '#000' : C.gris, border: `1px solid ${actif ? C.vif : C.trait2}`, fontFamily: 'inherit', fontSize: 11, padding: '6px 12px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {e.nom}
                </button>
              )
            })}
          </div>
        )}

        {/* Coup d'œil : la prochaine livraison, puis recommander */}
        <div style={{ marginBottom: 16 }}>
          <CarteBloc titre="Prochaine livraison">
            <ProchaineLivraison
              livraisons={livraisonsVues}
              lignes={parLivraison}
              etablissements={etablissements}
            />
          </CarteBloc>
        </div>

        {/* Recommander */}
        <div style={{ ...S.carte, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '18px 24px', marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <Label style={{ marginBottom: 6 }}>{quantitesDerniere ? 'Votre dernière commande' : 'Besoin de boîtes ?'}</Label>
            <div style={{ fontSize: 12, color: C.doux }}>
              {quantitesDerniere
                ? Object.entries(quantitesDerniere).map(([r, q]) => `${r} × ${formatNombre(q)}`).join('   ·   ')
                : 'Passez votre première commande en quelques clics.'}
            </div>
          </div>
          <BoutonPrincipal onClick={recommander} style={{ width: 'auto', padding: '12px 28px', flexShrink: 0 }}>
            {quantitesDerniere ? 'Recommander' : 'Commander'}
          </BoutonPrincipal>
        </div>

        {/* Formulaire de commande */}
        <Section titre="Passer commande" style={{ marginTop: 40 }}>
          <Commander
            key={cleFormulaire}
            references={references}
            etablissements={etablissements}
            etablissementImpose={identite.etablissementId}
            prefill={prefill}
            numeroConfirme={idConfirme ? (commandes.find(c => c.id === idConfirme)?.numero ?? null) : null}
            tarif={tarif}
            joursComplets={joursComplets}
            onCommandePassee={commandePassee}
          />
        </Section>

        {/* Commandes */}
        <Section titre="Vos commandes">
          {commandesVues.length === 0 ? (
            <Vide>Aucune commande pour l’instant.</Vide>
          ) : (
            <Tableau
              colonnes={[
                { titre: 'Demandée le' }, { titre: 'N°' }, { titre: 'Détail' },
                { titre: 'Souhaitée' }, { titre: 'Statut', aligne: 'right' },
              ]}
            >
              {commandesVues.map(c => (
                <tr key={c.id}>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{formatDate(c.demande_le)}</td>
                  <td style={{ ...TD, color: C.gris, fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap' }}>{c.numero || '—'}</td>
                  <td style={TD}>
                    {(parCommande.get(c.id) || []).map(l => `${l.reference} × ${formatNombre(l.quantite)}`).join('   ·   ') || '—'}
                    {c.notes_client && (
                      <div style={{ fontSize: 11, color: C.pale, marginTop: 4, fontStyle: 'italic' }}>{c.notes_client}</div>
                    )}
                  </td>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{c.souhaitee_le ? formatDate(c.souhaitee_le) : '—'}</td>
                  <td style={{ ...TD, textAlign: 'right' }}><Statut valeur={c.statut} /></td>
                </tr>
              ))}
            </Tableau>
          )}
        </Section>

        {/* Livraisons */}
        <Section titre="Vos livraisons">
          {livraisonsVues.length === 0 ? (
            <Vide>Aucune livraison enregistrée.</Vide>
          ) : (
            <Tableau
              colonnes={[
                { titre: 'Date' }, { titre: 'Contenu' }, { titre: 'TVA' },
                { titre: 'Montant HTVA', aligne: 'right' }, { titre: 'État', aligne: 'right' },
              ]}
            >
              {livraisonsVues.map(l => (
                <tr key={l.id}>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{formatDate(l.date_livraison)}</td>
                  <td style={TD}>
                    {(parLivraison.get(l.id) || []).map(x => `${x.taille} × ${formatNombre(x.quantite)}`).join('   ·   ')
                      || texteProduits(l.produits) || '—'}
                    {compteGroupe && (
                      <div style={{ fontSize: 11, color: C.pale, marginTop: 4 }}>{nommer(l.etablissement)}</div>
                    )}
                  </td>
                  <td style={{ ...TD, color: C.gris, whiteSpace: 'nowrap' }}>{l.tva_taux == null ? '—' : `${l.tva_taux} %`}</td>
                  <td style={{ ...TD, color: C.vif, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatEuros(l.prix_htva)}</td>
                  <td style={{ ...TD, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Statut valeur={l.livre ? 'Livrée' : 'À livrer'} ton={l.livre ? 'ok' : 'cours'} />
                    {' '}
                    <Statut valeur={l.paiement_recu ? 'Payée' : 'À régler'} ton={l.paiement_recu ? 'ok' : 'cours'} />
                  </td>
                </tr>
              ))}
            </Tableau>
          )}
        </Section>

        {/* Documents */}
        <Section titre="Vos devis et documents">
          {documents.length === 0 ? (
            <Vide>Aucun document.</Vide>
          ) : (
            <Tableau
              colonnes={[
                { titre: 'Date' }, { titre: 'Type' }, { titre: 'N°' }, { titre: 'Objet' },
                { titre: 'Échéance' }, { titre: 'Montant', aligne: 'right' }, { titre: 'Statut', aligne: 'right' },
              ]}
            >
              {documents.map(d => (
                <tr key={d.id}>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{formatDate(d.date_doc)}</td>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{d.type || '—'}</td>
                  <td style={{ ...TD, color: C.gris, fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap' }}>{d.numero || '—'}</td>
                  <td style={TD}>{d.objet || '—'}</td>
                  <td style={{ ...TD, color: C.doux, whiteSpace: 'nowrap' }}>{d.echeance ? formatDate(d.echeance) : '—'}</td>
                  <td style={{ ...TD, color: C.vif, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatEuros(d.montant)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}><Statut valeur={d.statut} /></td>
                </tr>
              ))}
            </Tableau>
          )}
        </Section>

        {/* Contact */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: `1px solid ${C.trait}`, fontSize: 11, color: C.pale, lineHeight: 1.8 }}>
          Une question sur une commande, une livraison ou un devis ?
          Écrivez à{' '}
          <a href="mailto:contact@studiozeroquatre.com" style={{ color: C.gris }}>contact@studiozeroquatre.com</a>.
          {moi.contacts && <><br />Contact enregistré : {typeof moi.contacts === 'string' ? moi.contacts : JSON.stringify(moi.contacts)}</>}
        </div>
      </div>
    </Ecran>
  )
}
