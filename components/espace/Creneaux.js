'use client'
import { CRENEAUX, cleCreneau, creneauPasse, normaliserHeure } from '@/lib/creneaux'
import { C, MONO, Label } from './ui'

// Choix de l'heure de livraison — FACULTATIF.
//
// Sans choix, la livraison passe dans la journée : c'est le défaut, et il doit
// le rester. « Dans la journée » est donc un vrai bouton, sélectionné d'entrée,
// et non une absence de choix qu'il faudrait deviner.
//
// Un créneau déjà réservé est barré : le studio ne peut pas être à deux
// endroits à la fois, donc un créneau pris l'est pour tout le monde. La vue
// `portail_creneaux_pris` ne dit rien de plus qu'une date et une heure —
// jamais chez qui.
//
// Tant que la vue n'existe pas côté base (`creneauxPris` à null), on n'affiche
// aucun créneau plutôt que de tous les annoncer libres : promettre une heure
// qu'on ne peut pas vérifier serait pire que ne pas la proposer.

export default function Creneaux({ date, heure, onChange, creneauxPris }) {
  if (!date || creneauxPris === null) return null

  const pris = new Set((creneauxPris || []).map(c => cleCreneau(c.date, c.heure)))
  const choisie = normaliserHeure(heure)

  const bouton = (actif, bloque) => ({
    background: actif ? C.vif : 'none',
    color: actif ? '#000' : bloque ? C.accent : C.texte,
    border: `1px solid ${actif ? C.vif : C.trait2}`,
    borderRadius: 3,
    fontFamily: MONO,
    fontSize: 12,
    padding: '7px 0',
    cursor: bloque ? 'not-allowed' : 'pointer',
    textDecoration: bloque ? 'line-through' : 'none',
    opacity: bloque ? 0.45 : 1,
    transition: 'all 0.12s',
  })

  return (
    <div style={{ marginTop: 16 }}>
      <Label>Heure de livraison — facultatif</Label>

      <div style={{ maxWidth: 340 }}>
        <button
          type="button"
          onClick={() => onChange('')}
          style={{ ...bouton(!choisie, false), width: '100%', marginBottom: 6 }}
        >
          Dans la journée
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {CRENEAUX.map(c => {
            const passe = creneauPasse(date, c)
            const reserve = pris.has(cleCreneau(date, c))
            const bloque = passe || reserve
            const raison = passe ? 'Créneau déjà passé' : reserve ? 'Créneau déjà réservé' : undefined
            const actif = choisie === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => !bloque && onChange(c)}
                disabled={bloque}
                title={raison}
                aria-label={`${c}${raison ? ` — ${raison.toLowerCase()}` : ''}`}
                style={bouton(actif, bloque)}
              >
                {c}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 10, color: C.pale, marginTop: 8, lineHeight: 1.6 }}>
          Sans heure choisie, nous livrons dans la journée. Un créneau{' '}
          <span style={{ color: C.accent, textDecoration: 'line-through' }}>barré</span> est déjà réservé.
        </div>
      </div>
    </div>
  )
}
