'use client'
import { useState } from 'react'
import ContactSuccess from '@/components/contact/ContactSuccess'

const FIELD_CLASS =
  'w-full font-mono text-sm border border-[var(--border2)] bg-bg px-3 py-3 rounded focus:outline-none focus:border-[var(--text)] transition-colors placeholder:text-text3'

const LABEL_CLASS = 'font-mono text-xs text-text2 uppercase tracking-widest mb-1 block'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <ContactSuccess />

  return (
    <div className="min-h-dvh pt-20 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">Contact</p>
          <h1 className="font-syne font-bold text-3xl md:text-4xl">
            Une question&nbsp;? Écrivez-nous.
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label htmlFor="name" className={LABEL_CLASS}>Nom</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={FIELD_CLASS}
              placeholder="Votre nom"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className={LABEL_CLASS}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={FIELD_CLASS}
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="message" className={LABEL_CLASS}>Message</label>
            <textarea
              id="message"
              rows={6}
              required
              value={form.message}
              onChange={(e) => updateField('message', e.target.value)}
              className={`${FIELD_CLASS} resize-none`}
              placeholder="Votre question ou votre message..."
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-mono text-sm py-4 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </div>
  )
}
