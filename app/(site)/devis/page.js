'use client'
import { useState, useId } from 'react'
import SuccessScreen from '@/components/devis/SuccessScreen'
import { cn } from '@/lib/cn'
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/products'

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

const PRODUCTS_BY_CATEGORY = PRODUCT_CATEGORIES.map((cat) => ({
  category: cat,
  items: PRODUCTS.filter((p) => p.category === cat),
}))

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null
}

let lineCounter = 0
function makeLineId() {
  return `line-${++lineCounter}`
}

function emptyLine() {
  return { lineId: makeLineId(), productId: '', dimension: '', volume: '' }
}

function ProductLine({ line, onChange, onRemove, isOnly }) {
  const product = getProduct(line.productId)
  const hasDimensions = product?.dimensions?.length > 0

  function handleProductChange(e) {
    const id = e.target.value
    const p = getProduct(id)
    onChange({ ...line, productId: id, dimension: p?.dimensions?.[0] ?? '' })
  }

  return (
    <div className="border border-[var(--border)] rounded p-4 bg-surface">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        {/* Product + dimension row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Product */}
          <div>
            <label className={LABEL_CLASS}>Produit</label>
            <select
              value={line.productId}
              onChange={handleProductChange}
              className={cn(FIELD_CLASS, !line.productId && 'text-text3')}
            >
              <option value="">— Choisir un produit —</option>
              {PRODUCTS_BY_CATEGORY.map(({ category, items }) => (
                <optgroup key={category} label={category}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Dimension */}
          <div>
            <label className={LABEL_CLASS}>Dimension</label>
            {hasDimensions ? (
              <select
                value={line.dimension}
                onChange={(e) => onChange({ ...line, dimension: e.target.value })}
                className={cn(FIELD_CLASS, !line.dimension && 'text-text3')}
                disabled={!line.productId}
              >
                <option value="">— Format —</option>
                {product.dimensions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={line.dimension}
                onChange={(e) => onChange({ ...line, dimension: e.target.value })}
                placeholder={line.productId ? 'Préciser si besoin' : '—'}
                disabled={!line.productId}
                className={FIELD_CLASS}
              />
            )}
          </div>
        </div>

        {/* Volume */}
        <div className="sm:w-48">
          <label className={LABEL_CLASS}>Quantité / mois</label>
          <select
            value={line.volume}
            onChange={(e) => onChange({ ...line, volume: e.target.value })}
            className={cn(FIELD_CLASS, !line.volume && 'text-text3')}
            disabled={!line.productId}
          >
            <option value="">— Volume —</option>
            {VOLUMES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!isOnly && (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={onRemove}
            className="font-mono text-xs text-text3 hover:text-text transition-colors uppercase tracking-widest"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

export default function DevisPage() {
  const [form, setForm] = useState({
    restaurant: '',
    name: '',
    email: '',
    phone: '',
    boxType: '',
    notes: '',
  })
  const [lines, setLines] = useState([emptyLine()])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateLine(lineId, updated) {
    setLines((ls) => ls.map((l) => (l.lineId === lineId ? updated : l)))
  }

  function addLine() {
    setLines((ls) => [...ls, emptyLine()])
  }

  function removeLine(lineId) {
    setLines((ls) => ls.filter((l) => l.lineId !== lineId))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      ...form,
      products: lines
        .filter((l) => l.productId)
        .map((l) => ({
          product: getProduct(l.productId)?.name ?? l.productId,
          dimension: l.dimension,
          volume: l.volume,
        })),
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
              href="mailto:contact@studiozeroquatre.com"
              className="text-text2 hover:text-text transition-colors border-b border-[var(--border2)] pb-0.5"
            >
              contact@studiozeroquatre.com
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={LABEL_CLASS}>Nom du restaurant</label>
              <input
                type="text"
                required
                value={form.restaurant}
                onChange={(e) => updateField('restaurant', e.target.value)}
                className={FIELD_CLASS}
                placeholder="Volta Supper Club"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Votre nom</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={FIELD_CLASS}
                placeholder="Marie Dupont"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={FIELD_CLASS}
                placeholder="contact@monrestaurant.be"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={FIELD_CLASS}
                placeholder="+32 478 000 000"
              />
            </div>
          </div>

          {/* Products */}
          <div className="mb-10">
            <p className={cn(LABEL_CLASS, 'mb-4')}>Produits souhaités</p>
            <div className="flex flex-col gap-3">
              {lines.map((line) => (
                <ProductLine
                  key={line.lineId}
                  line={line}
                  onChange={(updated) => updateLine(line.lineId, updated)}
                  onRemove={() => removeLine(line.lineId)}
                  isOnly={lines.length === 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-text2 hover:text-text transition-colors"
            >
              <span className="w-4 h-4 border border-[var(--border2)] rounded-sm flex items-center justify-center text-base leading-none">+</span>
              Ajouter un produit
            </button>
          </div>

          {/* Type */}
          <div className="mb-8">
            <label className={LABEL_CLASS}>Type de packaging</label>
            <select
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

          {/* Notes */}
          <div className="mb-8">
            <label className={LABEL_CLASS}>Informations complémentaires</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={cn(FIELD_CLASS, 'resize-none')}
              placeholder="Précisions sur votre projet, contraintes particulières..."
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
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  )
}
