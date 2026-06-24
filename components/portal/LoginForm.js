'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginForm({ onLogin, error }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    await onLogin(code)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 3,
    color: '#f0f0f0',
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '10px 12px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#f0f0f0', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e', maxWidth: 900, margin: '0 auto' }}>
        <Image src="/images/logo.jpg" alt="Studio 04" width={80} height={32} style={{ objectFit: 'contain', filter: 'invert(1)' }} />
        <Link
          href="/"
          style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', fontFamily: 'inherit', fontSize: 11, padding: '6px 14px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b35'; e.currentTarget.style.color = '#ff6b35' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666' }}
        >
          ← Retour
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 40, width: '100%', maxWidth: 420 }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f0f0f0' }}>
            Espace clients
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>
            Accédez à votre espace commande personnalisé.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Code d&apos;accès
              </label>
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="••••••"
                autoComplete="off"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#2a2a2a' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', color: '#ff6b35', fontSize: 12, padding: '10px 12px', borderRadius: 3, marginBottom: 8 }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || loading}
              style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 3, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, padding: 12, cursor: !code.trim() || loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s', marginTop: 8, opacity: !code.trim() || loading ? 0.3 : 1 }}
            >
              {loading ? 'Connexion...' : 'Accéder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
