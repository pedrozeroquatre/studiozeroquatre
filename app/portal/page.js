'use client'
import { useState } from 'react'
import LoginForm from '@/components/portal/LoginForm'
import Dashboard from '@/components/portal/Dashboard'

export default function PortalPage() {
  const [view, setView] = useState('login')
  const [client, setClient] = useState(null)
  const [error, setError] = useState('')

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

  if (view === 'dashboard' && client) {
    return <Dashboard client={client} onLogout={handleLogout} />
  }

  return <LoginForm onLogin={handleLogin} error={error} />
}
