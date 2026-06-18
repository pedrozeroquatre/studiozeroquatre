import Link from 'next/link'

export default function ProduitsPage() {
  return (
    <div className="min-h-dvh pt-20 pb-24 px-6 flex items-center">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">Produits</p>
        <h1 className="font-syne font-bold text-3xl md:text-4xl mb-6">
          Notre catalogue arrive bientôt.
        </h1>
        <p className="font-mono text-sm text-text2 leading-relaxed mb-8 max-w-md">
          Boîtes pizza, sacs kraft, barquettes et plus encore — la page produits est en cours de
          construction. En attendant, contactez-nous directement pour discuter de vos besoins.
        </p>
        <Link
          href="/devis"
          className="inline-block font-mono text-sm bg-[var(--text)] text-[var(--bg)] px-6 py-3 rounded hover:opacity-80 transition-opacity"
        >
          Demander un devis
        </Link>
      </div>
    </div>
  )
}
