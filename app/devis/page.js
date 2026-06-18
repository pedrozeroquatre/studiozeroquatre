'use client'
import { useState } from 'react'
import SuccessScreen from '@/components/devis/SuccessScreen'
import { cn } from '@/lib/cn'

const FORMATS = ['26×26×4cm', '30×30×4cm', '33×33×4cm', '36×36×4cm']

const VOLUMES = [
  { value: '<500', label: '< 500 unités/mois' },
  { value: '500-2000', label: '500 – 2000 unités/mois' },
  { value: '2000-5000', label: '2000 – 5000 unités/mois' },
  { value: '5000+', label: '5000+ unités/mois' },
]

const BOX_TYPES = [
  'Blanc sans impression',
  'Personnalisée (avec design)',
  'Les deux',
]

const FIELD_CLASS =
  'w-full font-mono text-sm border border-[var(--border2)] bg-bg px-3 py-3 rounded focus:outline-none focus:border-[var(--text)] transition-colors placeholder:text-text3'

const LABEL_CLASS = 'font-mono text-xs text-text2 uppercase tracking-widest mb-1 block'

export default function DevisPage() {
  const [form, setForm] = useState({
    restaurant: '',
    name: '',
    email: '',
    phone: '',
    formats: [],
    volume: '',
    boxType: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleFormat(format) {
    setForm((f) => ({
      ...f,
      formats: f.formats.includes(format)
        ? f.formats.filter((v) => v !== format)
        : [...f.formats, format],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
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

  if (submitted) return <SuccessScreen />

  return (
    <div className="min-h-dvh pt-20 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">
            Demande de devis
          </p>
          <h1 className="font-syne font-bold text-3xl md:text-4xl mb-4">
            <span className="block">Votre packaging,</span>
            <span className="block">votre identité.</span>
          </h1>
          <p className="font-mono text-sm text-text2 leading-relaxed">
            Remplissez le formulaire. Réponse sous 24h.
            <br />
            Ou écrivez-nous directement à{' '}
            <a
              href="mailto:studiozeroquatre@gmail.com"
              className="text-text2 hover:text-text transition-colors border-b border-[var(--border2)] pb-0.5"
            >
              studiozeroquatre@gmail.com
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Restaurant + Contact name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="restaurant" className={LABEL_CLASS}>Nom du restaurant</label>
              <input
                id="restaurant"
                type="text"
                required
                value={form.restaurant}
                onChange={(e) => updateField('restaurant', e.target.value)}
                className={FIELD_CLASS}
                placeholder="Volta Supper Club"
              />
            </div>
            <div>
              <label htmlFor="name" className={LABEL_CLASS}>Votre nom</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={FIELD_CLASS}
                placeholder="Marie Dupont"
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={FIELD_CLASS}
                placeholder="contact@monrestaurant.be"
              />
            </div>
            <div>
              <label htmlFor="phone" className={LABEL_CLASS}>Téléphone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={FIELD_CLASS}
                placeholder="+32 478 000 000"
              />
            </div>
          </div>

          {/* Formats souhaités */}
          <fieldset className="mb-8">
            <legend className={cn(LABEL_CLASS, 'mb-3')}>Formats souhaités</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FORMATS.map((format) => (
                <label
                  key={format}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer font-mono text-xs text-text2 border rounded px-3 py-3 transition-colors min-h-[44px]',
                    form.formats.includes(format)
                      ? 'border-[var(--text)] bg-surface text-text'
                      : 'border-[var(--border)] hover:border-[var(--border2)]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.formats.includes(format)}
                    onChange={() => toggleFormat(format)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center',
                      form.formats.includes(format)
                        ? 'bg-[var(--text)] border-[var(--text)]'
                        : 'border-[var(--border2)]'
                    )}
                    aria-hidden="true"
                  >
                    {form.formats.includes(format) && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {format}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Volume mensuel estimé */}
          <div className="mb-6">
            <label htmlFor="volume" className={LABEL_CLASS}>Volume mensuel estimé</label>
            <select
              id="volume"
              value={form.volume}
              onChange={(e) => updateField('volume', e.target.value)}
              className={cn(FIELD_CLASS, !form.volume && 'text-text3')}
            >
              <option value="">— Sélectionner —</option>
              {VOLUMES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Type de boîte */}
          <div className="mb-8">
            <label htmlFor="boxType" className={LABEL_CLASS}>Type de boîte</label>
            <select
              id="boxType"
              value={form.boxType}
              onChange={(e) => updateField('boxType', e.target.value)}
              className={cn(FIELD_CLASS, !form.boxType && 'text-text3')}
            >
              <option value="">— Sélectionner —</option>
              {BOX_TYPES.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>

          {/* Informations complémentaires */}
          <div className="mb-8">
            <label htmlFor="notes" className={LABEL_CLASS}>Informations complémentaires</label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={cn(FIELD_CLASS, 'resize-none')}
              placeholder="Précisions sur votre projet, contraintes particulières..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-xs text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-mono text-sm py-4 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  )
}
