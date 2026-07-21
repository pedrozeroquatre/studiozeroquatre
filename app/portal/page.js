'use client'
import { useState, useEffect } from 'react'
import LoginForm from '@/components/portal/LoginForm'
import Dashboard from '@/components/portal/Dashboard'
import PortalNav from '@/components/portal/PortalNav'

export default function PortalPage() {
  const [view, setView] = useState('login')
  const [client, setClient] = useState(null)
  const [error, setError] = useState('')
  const [checkout, setCheckout] = useState(null) // { status, ref } after Stripe return

  // Stripe redirects back with ?checkout=success|cancel — the React login state
  // is gone by then, so we drive the confirmation from the URL instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('checkout')
    if (status === 'success' || status === 'cancel') {
      setCheckout({ status, ref: params.get('ref') || '' })
      setView(status === 'success' ? 'success' : 'login')
      window.history.replaceState(null, '', '/portal')
    }
  }, [])

  async function handleLogin(code) {
    setError('')
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok) {
        setClient(data)
        setView('dashboard')
      } else {
        setError(data.error ?? 'Code invalide. Vérifiez et réessayez.')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    }
  }

  function handleLogout() {
    setClient(null)
    setView('login')
    setError('')
  }

  if (view === 'success') {
    return (
      <div style={{ minHeight: '100dvh', background: '#000', color: '#f0f0f0', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
        <PortalNav />
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 24, color: '#fff' }}>✓</div>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Paiement confirmé !
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 32px' }}>
            Merci — Studio Zeroquatre a bien reçu votre commande et son paiement, et vous contactera pour la livraison.
          </div>
          {checkout?.ref && (
            <div style={{ display: 'inline-block', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '10px 20px', fontSize: 13, color: '#fff', letterSpacing: 2, marginBottom: 32 }}>
              {checkout.ref}
            </div>
          )}
          <br /><br />
          <button
            onClick={() => { setCheckout(null); setView('login') }}
            style={{ background: 'none', border: '1px solid #fff', color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 12, padding: '10px 24px', cursor: 'pointer', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (view === 'dashboard' && client) {
    return <Dashboard client={client} onLogout={handleLogout} />
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      error={error || (checkout?.status === 'cancel' ? 'Paiement annulé. Vous pouvez réessayer.' : '')}
    />
  )
}
