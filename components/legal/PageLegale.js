// Gabarit des pages légales : même en-tête que /contact, une colonne de
// lecture, et des primitives de texte pour que les trois pages restent
// alignées sans répéter leurs classes.
export default function PageLegale({ surtitre, titre, miseAJour, children }) {
  return (
    <div className="min-h-dvh pt-20 pb-24 px-6">
      <article className="max-w-2xl mx-auto">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">{surtitre}</p>
          <h1 className="font-syne font-bold text-3xl md:text-4xl">{titre}</h1>
          {miseAJour && (
            <p className="font-mono text-xs text-text3 mt-4">Dernière mise à jour : {miseAJour}</p>
          )}
        </header>
        <div className="font-mono text-sm text-text2 leading-relaxed">{children}</div>
      </article>
    </div>
  )
}

export function Bloc({ id, titre, children }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="font-syne font-bold text-lg text-text mb-3">{titre}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Liste({ children }) {
  return <ul className="list-disc pl-5 space-y-1">{children}</ul>
}

export function Lien({ href, children }) {
  return (
    <a href={href} className="text-text underline underline-offset-2 hover:text-text2 transition-colors">
      {children}
    </a>
  )
}
