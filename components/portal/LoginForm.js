'use client'
import { useState } from 'react'

export default function LoginForm({ onLogin, error }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await onLogin(code)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-24">
      <div className="max-w-sm w-full">
        <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-6">
          Espace clients
        </p>
        <h1 className="font-syne font-bold text-2xl mb-8">
          Accédez à votre espace.
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label htmlFor="client-code" className="font-mono text-xs text-text2 uppercase tracking-widest mb-1 block">
              Code d&apos;accès
            </label>
            <input
              id="client-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SZQ-XXXX-XXXX"
              required
              spellCheck={false}
              autoComplete="off"
              className="w-full font-mono text-sm border border-[var(--border2)] bg-bg px-3 py-3 rounded focus:outline-none focus:border-[var(--text)] transition-colors placeholder:text-text3"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-600 mb-4 mt-2" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full mt-4 font-mono text-sm py-3 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Accéder'}
          </button>
        </form>

        <p className="font-mono text-xs text-text3 mt-6 text-center">
          Votre code vous a été envoyé par e-mail lors de votre première commande.
        </p>
      </div>
    </div>
  )
}
