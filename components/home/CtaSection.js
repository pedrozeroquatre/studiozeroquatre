import Link from 'next/link'

export default function CtaSection() {
  return (
    <section className="py-14 px-6 bg-bg border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto text-center">
        <h2
          className="font-syne font-bold text-3xl md:text-4xl mb-8"
          data-fr="Prêt à sublimer votre packaging ?"
          data-en="Ready to elevate your packaging?"
        >
          Prêt à sublimer votre packaging&nbsp;?
        </h2>
        <Link
          href="/devis"
          className="inline-block font-mono text-sm px-8 py-4 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity"
          data-fr="Demander un devis"
          data-en="Request a quote"
        >
          Demander un devis
        </Link>
      </div>
    </section>
  )
}
