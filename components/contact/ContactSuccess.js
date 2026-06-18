export default function ContactSuccess() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full">
        <div className="border border-[var(--border)] p-8 rounded">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-6">
            Message envoyé
          </p>
          <h1 className="font-syne font-bold text-2xl mb-2">
            Merci de nous avoir écrit.
          </h1>
          <p className="font-mono text-sm text-text2 mb-8 leading-relaxed">
            Nous vous répondons par e-mail dans les 24h.
          </p>

          <a
            href="/"
            className="inline-block font-mono text-xs text-text2 hover:text-text transition-colors border-b border-[var(--border2)] pb-0.5"
          >
            ← Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  )
}
