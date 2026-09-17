import { CHAMP_PIEGE } from '@/lib/limite-debit'

// Le champ piège des formulaires publics.
//
// Invisible à l'œil, retiré du parcours au clavier (`tabIndex={-1}`) et signalé
// aux lecteurs d'écran comme à ignorer : un visiteur ne peut pas le remplir,
// même par accident. Un robot qui remplit tous les champs qu'il trouve, si — et
// c'est comme ça qu'il se trahit.
//
// Il est placé hors de l'écran plutôt qu'en `display: none` : certains robots
// savent ignorer ce qui est masqué de cette façon.
//
// Le nom du champ vit dans lib/limite-debit.js, avec le contrôle qui le lit.
export default function ChampPiege({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <label htmlFor={CHAMP_PIEGE}>Ne remplissez pas ce champ</label>
      <input
        id={CHAMP_PIEGE}
        name={CHAMP_PIEGE}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
