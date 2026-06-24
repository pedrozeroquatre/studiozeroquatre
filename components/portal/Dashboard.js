'use client'
import { useState } from 'react'
import Image from 'next/image'
import { generateRef } from '@/lib/generateRef'

const S = {
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#444', marginBottom: 12 },
}

export default function Dashboard({ client, onLogout }) {
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState('')
  const [view, setView] = useState('order')
  const [orderRef, setOrderRef] = useState('')

  const lines = client.products
    .map(p => ({ ...p, qty: parseInt(quantities[p.id] || 0) }))
    .map(p => ({ ...p, sub: p.qty * p.price }))
    .filter(p => p.qty > 0)

  const total = lines.reduce((s, l) => s + l.sub, 0)

  function handleConfirm() {
    setOrderRef(generateRef())
    setView('success')
  }

  function handleNewOrder() {
    setQuantities({})
    setNote('')
    setView('order')
  }

  const navBar = (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e', maxWidth: 900, margin: '0 auto' }}>
      <Image src="/images/logo.jpg" alt="Studio 04" width={80} height={32} style={{ objectFit: 'contain', filter: 'invert(1)' }} />
    </div>
  )

  if (view === 'success') {
    return (
      <div style={{ minHeight: '100dvh', background: '#000', color: '#f0f0f0', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
        {navBar}
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 24, color: '#fff' }}>✓</div>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Commande envoyée !
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 32px' }}>
            Studio Zeroquatre a reçu votre commande et vous contactera pour confirmer la date de livraison et le paiement.
          </div>
          <div style={{ display: 'inline-block', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '10px 20px', fontSize: 13, color: '#fff', letterSpacing: 2, marginBottom: 32 }}>
            {orderRef}
          </div>
          <br /><br />
          <button
            onClick={handleNewOrder}
            style={{ background: 'none', border: '1px solid #fff', color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 12, padding: '10px 24px', cursor: 'pointer', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#fff' }}
          >
            Nouvelle commande
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#f0f0f0', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
      {navBar}

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

        {/* Vos formats */}
        <div style={S.label}>Vos formats</div>
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
            <strong style={{ color: '#ff6b35' }}>Paiement en ligne bientôt disponible</strong><br />
            Votre commande sera confirmée par Pedro qui vous enverra un lien de paiement.
          </p>
        </div>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={total === 0}
          style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 3, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, padding: '14px 32px', cursor: total === 0 ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s', opacity: total === 0 ? 0.3 : 1 }}
          onMouseEnter={e => { if (total > 0) e.currentTarget.style.background = '#e0e0e0' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
        >
          Confirmer la commande
        </button>
      </div>
    </div>
  )
}
