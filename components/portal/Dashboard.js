'use client'
import { useState, useEffect } from 'react'
import PortalNav from './PortalNav'
import { getLastOrder, saveLastOrder } from '@/lib/lastOrder'

const S = {
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#444', marginBottom: 12 },
  chip: { background: '#111', border: '1px solid #2a2a2a', color: '#f0f0f0', fontFamily: 'inherit', fontSize: 12, padding: '6px 12px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' },
}

const QUICK = [500, 1000, 2000]

export default function Dashboard({ client, onLogout }) {
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bulk, setBulk] = useState('')
  const [lastOrder, setLastOrder] = useState(null)

  useEffect(() => { setLastOrder(getLastOrder(client.id)) }, [client.id])

  const lines = client.products
    .map(p => ({ ...p, qty: parseInt(quantities[p.id] || 0) }))
    .map(p => ({ ...p, sub: p.qty * p.price }))
    .filter(p => p.qty > 0)

  const total = lines.reduce((s, l) => s + l.sub, 0)

  // Last order limited to the client's current formats (a format may have changed).
  const lastLines = lastOrder
    ? client.products
        .map(p => ({ ...p, qty: parseInt(lastOrder.quantities[p.id] || 0) }))
        .filter(p => p.qty > 0)
    : []

  const setLine = (id, n) => setQuantities(q => ({ ...q, [id]: String(n) }))
  const applyAll = n => setQuantities(Object.fromEntries(client.products.map(p => [p.id, String(n)])))
  const applyBulk = () => { const n = parseInt(bulk); if (n > 0) applyAll(n) }
  const reorderLast = () => setQuantities(
    Object.fromEntries(lastLines.map(l => [l.id, String(l.qty)]))
  )

  const hoverChip = e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }
  const leaveChip = e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#f0f0f0' }

  async function handleConfirm() {
    setError('')
    setSubmitting(true)
    saveLastOrder(client.id, quantities)
    try {
      const res = await fetch('/api/portal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, quantities, note }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error || 'Erreur lors de la création du paiement.')
      setSubmitting(false)
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#f0f0f0', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
      <PortalNav />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Welcome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid #1e1e1e', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={S.label}>Espace commande</div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 20, fontWeight: 700, color: '#f0f0f0' }}>
              Bonjour, <span style={{ color: '#fff' }}>{client.name}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', fontFamily: 'inherit', fontSize: 11, padding: '6px 12px', cursor: 'pointer', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b35'; e.currentTarget.style.color = '#ff6b35' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666' }}
          >
            Déconnexion
          </button>
        </div>

        {/* Refaire la dernière commande */}
        {lastLines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '14px 18px', marginBottom: 28 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...S.label, marginBottom: 6 }}>Dernière commande</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {lastLines.map(l => `${l.fmt} × ${l.qty.toLocaleString('fr')}`).join('   ·   ')}
              </div>
            </div>
            <button
              onClick={reorderLast}
              style={{ background: '#fff', color: '#000', border: 'none', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 11, padding: '9px 18px', cursor: 'pointer', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              Recommander
            </button>
          </div>
        )}

        {/* Vos formats */}
        <div style={S.label}>Vos formats</div>

        {/* Même quantité partout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: '#666', marginRight: 2 }}>Même quantité partout :</span>
          {QUICK.map(n => (
            <button key={n} onClick={() => applyAll(n)} style={S.chip} onMouseEnter={hoverChip} onMouseLeave={leaveChip}>
              {n.toLocaleString('fr')}
            </button>
          ))}
          <input
            type="number"
            min="0"
            step="100"
            value={bulk}
            onChange={e => setBulk(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyBulk() }}
            placeholder="Autre"
            style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 3, color: '#f0f0f0', fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', width: 80, textAlign: 'right', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = '#fff' }}
            onBlur={e => { e.target.style.borderColor = '#2a2a2a' }}
          />
          <button onClick={applyBulk} style={S.chip} onMouseEnter={hoverChip} onMouseLeave={leaveChip}>
            Appliquer
          </button>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Format', 'Qualité', 'Prix/boîte', 'Quantité', 'Sous-total'].map((h, i) => (
                  <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#444', textAlign: i === 4 ? 'right' : 'left', padding: '8px 12px', borderBottom: '1px solid #2a2a2a', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.products.map(p => {
                const qty = parseInt(quantities[p.id] || 0)
                const sub = qty * p.price
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1e1e1e', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0a0a0a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: 12, verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', background: '#111', border: '1px solid #2a2a2a', borderRadius: 3, padding: '3px 8px', fontSize: 12, fontWeight: 500 }}>{p.fmt}</span>
                    </td>
                    <td style={{ padding: 12, fontSize: 11, color: '#666', verticalAlign: 'middle' }}>{p.qual}</td>
                    <td style={{ padding: 12, fontSize: 13, color: '#fff', fontWeight: 500, verticalAlign: 'middle' }}>{p.price.toFixed(4)} €</td>
                    <td style={{ padding: 12, verticalAlign: 'middle' }}>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={quantities[p.id] ?? 0}
                        onChange={e => setQuantities(q => ({ ...q, [p.id]: e.target.value }))}
                        style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 3, color: '#f0f0f0', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', width: 90, textAlign: 'right', outline: 'none', transition: 'border-color 0.15s' }}
                        onFocus={e => { e.target.style.borderColor = '#fff' }}
                        onBlur={e => { e.target.style.borderColor = '#2a2a2a' }}
                      />
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-start' }}>
                        {QUICK.map(n => (
                          <button
                            key={n}
                            onClick={() => setLine(p.id, n)}
                            style={{ background: 'none', border: '1px solid #222', color: '#666', fontFamily: 'inherit', fontSize: 10, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#666' }}
                          >
                            {n.toLocaleString('fr')}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 500, textAlign: 'right', verticalAlign: 'middle', color: qty > 0 ? '#fff' : '#444' }}>
                      {qty > 0 ? `${sub.toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Récapitulatif */}
        <div style={S.label}>Récapitulatif</div>
        <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          {lines.length === 0 ? (
            <div style={{ fontSize: 12, color: '#444', padding: '8px 0' }}>Aucune boîte sélectionnée</div>
          ) : (
            lines.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #1e1e1e', color: '#f0f0f0' }}>
                <span style={{ color: '#888' }}>{l.fmt} × {l.qty.toLocaleString('fr')}</span>
                <span>{l.sub.toFixed(2)} €</span>
              </div>
            ))
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 8, borderTop: '2px solid #2a2a2a' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#f0f0f0' }}>
              Total commande
            </div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {total.toFixed(2).replace('.', ',')} €
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 24 }}>
          <div style={S.label}>Note (optionnel)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Date de livraison souhaitée, informations complémentaires..."
            style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 3, color: '#f0f0f0', fontFamily: 'inherit', fontSize: 12, padding: 12, outline: 'none', resize: 'vertical', minHeight: 80, lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            onFocus={e => { e.target.style.borderColor = '#fff' }}
            onBlur={e => { e.target.style.borderColor = '#2a2a2a' }}
          />
        </div>

        {/* Payment notice */}
        <div style={{ background: '#0a0a0a', border: '1px dashed #2a2a2a', borderRadius: 3, padding: 20, textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>
            Paiement sécurisé par <strong style={{ color: '#f0f0f0' }}>Stripe</strong>.<br />
            Vous serez redirigé vers une page de paiement, puis Pedro reçoit votre commande.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid #ff6b35', borderRadius: 3, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#ff6b35' }}>
            {error}
          </div>
        )}

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={total === 0 || submitting}
          style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 3, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, padding: '14px 32px', cursor: total === 0 || submitting ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s', opacity: total === 0 || submitting ? 0.3 : 1 }}
          onMouseEnter={e => { if (total > 0 && !submitting) e.currentTarget.style.background = '#e0e0e0' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
        >
          {submitting ? 'Redirection…' : `Payer ${total.toFixed(2).replace('.', ',')} €`}
        </button>
      </div>
    </div>
  )
}
