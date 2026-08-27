'use client'
import PortalNav from '@/components/portal/PortalNav'

// Primitives visuelles de l'espace client.
//
// Mêmes règles que le portail : **styles inline exclusivement**, palette
// sombre, pas de classes Tailwind. Les valeurs sont celles déjà en place
// (#000 / #0a0a0a / #2a2a2a / #ff6b35, Syne pour les titres, DM Mono pour le
// corps, rayon 3 ou 8) — on refait la plomberie, pas la façade.

export const C = {
  fond: '#000',
  carte: '#0a0a0a',
  champ: '#111',
  trait: '#1e1e1e',
  trait2: '#2a2a2a',
  texte: '#f0f0f0',
  vif: '#fff',
  doux: '#888',
  gris: '#666',
  pale: '#444',
  accent: '#ff6b35',
}

export const MONO = 'var(--font-mono), ui-monospace, monospace'
export const SYNE = 'var(--font-syne), sans-serif'

export const S = {
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: C.pale, marginBottom: 12 },
  carte: { background: C.carte, border: `1px solid ${C.trait2}`, borderRadius: 8, padding: 24 },
  champ: {
    width: '100%',
    background: C.champ,
    border: `1px solid ${C.trait2}`,
    borderRadius: 3,
    color: C.texte,
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '10px 12px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  titre: { fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.texte },
}

// Focus/blur : la bordure passe au blanc, comme partout dans le portail.
export const focus = {
  onFocus: e => { e.target.style.borderColor = C.vif },
  onBlur: e => { e.target.style.borderColor = C.trait2 },
}

export function Ecran({ children, actions }) {
  return (
    <div style={{ minHeight: '100dvh', background: C.fond, color: C.texte, fontFamily: MONO }}>
      <PortalNav>{actions}</PortalNav>
      {children}
    </div>
  )
}

// Carte centrée des écrans d'authentification (connexion, mot de passe, erreur).
export function CarteAuth({ titre, intro, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
      <div style={{ ...S.carte, padding: 40, width: '100%', maxWidth: 420 }}>
        <div style={{ ...S.titre, marginBottom: 8 }}>{titre}</div>
        {intro && (
          <div style={{ fontSize: 12, color: C.doux, marginBottom: 28, lineHeight: 1.6 }}>{intro}</div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Label({ children, style }) {
  return <div style={{ ...S.label, ...style }}>{children}</div>
}

export function ChampTexte({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, color: C.doux, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input style={S.champ} {...focus} {...props} />
    </div>
  )
}

export function Alerte({ children, ton = 'erreur' }) {
  const couleur = ton === 'erreur' ? C.accent : C.texte
  const fond = ton === 'erreur' ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.04)'
  const bordure = ton === 'erreur' ? 'rgba(255,107,53,0.3)' : C.trait2
  return (
    <div
      role="alert"
      style={{ background: fond, border: `1px solid ${bordure}`, color: couleur, fontSize: 12, padding: '10px 12px', borderRadius: 3, marginBottom: 12, lineHeight: 1.6 }}
    >
      {children}
    </div>
  )
}

export function BoutonPrincipal({ children, disabled, style, ...props }) {
  return (
    <button
      disabled={disabled}
      style={{
        width: '100%',
        background: C.vif,
        color: '#000',
        border: 'none',
        borderRadius: 3,
        fontFamily: SYNE,
        fontWeight: 700,
        fontSize: 13,
        padding: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase',
        letterSpacing: 1,
        transition: 'all 0.15s',
        opacity: disabled ? 0.3 : 1,
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#e0e0e0' }}
      onMouseLeave={e => { e.currentTarget.style.background = C.vif }}
      {...props}
    >
      {children}
    </button>
  )
}

// Bouton discret bordé, qui s'allume en orange au survol — le motif déjà
// utilisé par « Déconnexion » et « ← Retour ».
export function BoutonFantome({ children, style, ...props }) {
  return (
    <button
      style={{
        background: 'none',
        border: `1px solid ${C.trait2}`,
        color: C.gris,
        fontFamily: 'inherit',
        fontSize: 11,
        padding: '6px 12px',
        cursor: 'pointer',
        borderRadius: 3,
        textTransform: 'uppercase',
        letterSpacing: 1,
        transition: 'all 0.15s',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.trait2; e.currentTarget.style.color = C.gris }}
      {...props}
    >
      {children}
    </button>
  )
}

// Pastille de format (26×26×4, 33×33×4…), reprise de la colonne « Format ».
export function Pastille({ children }) {
  return (
    <span style={{ display: 'inline-block', background: C.champ, border: `1px solid ${C.trait2}`, borderRadius: 3, padding: '3px 8px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

// Vocabulaire réel des statuts, lu dans le schéma de la base :
//   commandes_clients.statut  recue / confirmee / en_production / expediee /
//                             livree / annulee
//   documents.statut          brouillon / envoyé / à relancer / signé /
//                             refusé / expiré
// Le restaurateur lit « En production », pas « en_production ». Une valeur
// inconnue s'affiche telle quelle plutôt que de disparaître : si la base
// enrichit son vocabulaire, l'espace le montre au lieu de mentir.
const LIBELLES = {
  recue: 'Reçue',
  confirmee: 'Confirmée',
  en_production: 'En production',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

const TONS = {
  livree: 'ok',
  'signé': 'ok',
  recue: 'cours',
  confirmee: 'cours',
  en_production: 'cours',
  expediee: 'cours',
  brouillon: 'cours',
  'envoyé': 'cours',
  annulee: 'alerte',
  'refusé': 'alerte',
  'expiré': 'alerte',
  'à relancer': 'alerte',
}

const COULEURS = { ok: '#4ade80', cours: C.doux, alerte: C.accent }

export function Statut({ valeur, ton }) {
  if (valeur === null || valeur === undefined || valeur === '') {
    return <span style={{ color: C.pale }}>—</span>
  }
  const clef = String(valeur).toLowerCase()
  const libelle = LIBELLES[clef] ?? String(valeur)
  const couleur = COULEURS[ton ?? TONS[clef] ?? 'cours']

  return (
    <span style={{ display: 'inline-block', border: `1px solid ${couleur}33`, background: `${couleur}14`, color: couleur, borderRadius: 3, padding: '2px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>
      {libelle}
    </span>
  )
}

export function Section({ titre, children, style }) {
  return (
    <div style={{ marginTop: 56, ...style }}>
      <Label>{titre}</Label>
      {children}
    </div>
  )
}

// Tableau sombre à en-têtes discrets, identique à ceux du portail. `colonnes`
// est une liste de { cle, titre, aligne }.
export function Tableau({ colonnes, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {colonnes.map(c => (
              <th
                key={c.titre}
                style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: C.pale, textAlign: c.aligne || 'left', padding: '8px 12px', borderBottom: `1px solid ${C.trait2}`, fontWeight: 400, whiteSpace: 'nowrap' }}
              >
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export const TD = {
  padding: 12,
  fontSize: 12,
  color: C.texte,
  verticalAlign: 'top',
  borderBottom: `1px solid ${C.trait}`,
}

export function Vide({ children }) {
  return <div style={{ fontSize: 12, color: C.pale, padding: '12px 0', lineHeight: 1.6 }}>{children}</div>
}
