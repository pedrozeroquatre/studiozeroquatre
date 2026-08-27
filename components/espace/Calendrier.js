'use client'
import { useState } from 'react'
import { C, SYNE, Label } from './ui'

// Calendrier de choix de la date de livraison.
//
// Un `<input type="date">` ne sait pas griser des jours précis : impossible d'y
// montrer qu'une journée est complète. D'où ce calendrier — le restaurateur
// voit d'un coup d'œil les jours encore ouverts au lieu de se faire refuser sa
// date après coup.
//
// La capacité (4 livraisons/jour) est décidée par la base : `joursComplets`
// vient de la vue `portail_jours_complets`. Le portail n'en juge pas, il
// l'affiche — et la route de paiement revérifie de toute façon.

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre']

// yyyy-mm-dd en heure locale — jamais toISOString(), qui décale d'un jour
// selon le fuseau.
function iso(annee, mois, jour) {
  return `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
}

export default function Calendrier({ valeur, onChange, joursComplets = [] }) {
  const today = new Date()
  const [vue, setVue] = useState(() => ({ annee: today.getFullYear(), mois: today.getMonth() }))

  const complets = new Set(joursComplets)
  const aujourdhui = iso(today.getFullYear(), today.getMonth(), today.getDate())

  const premier = new Date(vue.annee, vue.mois, 1)
  const nbJours = new Date(vue.annee, vue.mois + 1, 0).getDate()
  // getDay() met dimanche à 0 ; on veut des semaines qui commencent le lundi.
  const decalage = (premier.getDay() + 6) % 7

  // On ne remonte pas avant le mois courant : une livraison ne se commande pas
  // dans le passé.
  const moisCourant = vue.annee === today.getFullYear() && vue.mois === today.getMonth()

  const deplacer = pas => setVue(v => {
    const d = new Date(v.annee, v.mois + pas, 1)
    return { annee: d.getFullYear(), mois: d.getMonth() }
  })

  const fleche = {
    background: 'none', border: `1px solid ${C.trait2}`, color: C.texte,
    fontFamily: 'inherit', fontSize: 13, width: 28, height: 28, borderRadius: 3,
    cursor: 'pointer', lineHeight: 1,
  }

  return (
    <div>
      <Label>Date de livraison</Label>

      <div style={{ background: C.carte, border: `1px solid ${C.trait2}`, borderRadius: 8, padding: 16, maxWidth: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => deplacer(-1)}
            disabled={moisCourant}
            aria-label="Mois précédent"
            style={{ ...fleche, opacity: moisCourant ? 0.25 : 1, cursor: moisCourant ? 'not-allowed' : 'pointer' }}
          >
            ‹
          </button>
          <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 700, color: C.vif, textTransform: 'capitalize' }}>
            {MOIS[vue.mois]} {vue.annee}
          </div>
          <button type="button" onClick={() => deplacer(1)} aria-label="Mois suivant" style={fleche}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {JOURS.map((j, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: C.pale, padding: '4px 0', letterSpacing: 1 }}>
              {j}
            </div>
          ))}

          {Array.from({ length: decalage }).map((_, i) => <div key={`v${i}`} />)}

          {Array.from({ length: nbJours }).map((_, i) => {
            const jour = i + 1
            const date = iso(vue.annee, vue.mois, jour)
            const passe = date < aujourdhui
            const complet = complets.has(date)
            const bloque = passe || complet
            const choisi = valeur === date

            return (
              <button
                key={jour}
                type="button"
                onClick={() => !bloque && onChange(date)}
                disabled={bloque}
                title={complet ? 'Journée complète' : undefined}
                aria-label={`${jour} ${MOIS[vue.mois]}${complet ? ' — journée complète' : ''}`}
                style={{
                  aspectRatio: '1',
                  background: choisi ? C.vif : 'none',
                  color: choisi ? '#000' : complet ? C.accent : passe ? '#333' : C.texte,
                  border: `1px solid ${choisi ? C.vif : 'transparent'}`,
                  borderRadius: 3,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  cursor: bloque ? 'not-allowed' : 'pointer',
                  textDecoration: complet ? 'line-through' : 'none',
                  opacity: passe ? 0.4 : 1,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!bloque && !choisi) e.currentTarget.style.borderColor = C.trait2 }}
                onMouseLeave={e => { if (!choisi) e.currentTarget.style.borderColor = 'transparent' }}
              >
                {jour}
              </button>
            )
          })}
        </div>

        {complets.size > 0 && (
          <div style={{ fontSize: 10, color: C.pale, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.trait}`, lineHeight: 1.6 }}>
            <span style={{ color: C.accent, textDecoration: 'line-through' }}>barré</span>
            {' '}= journée complète, nous ne pouvons plus livrer ce jour-là.
          </div>
        )}
      </div>
    </div>
  )
}
