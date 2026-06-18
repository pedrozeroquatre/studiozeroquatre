const STEPS = [
  {
    num: '01',
    title: 'Demande de devis',
    desc: 'Remplissez le formulaire avec vos formats, volumes et design souhaité. Réponse sous 24h.',
  },
  {
    num: '02',
    title: 'Validation du design',
    desc: 'Nous validons ensemble le BAT avant lancement de la production.',
  },
  {
    num: '03',
    title: 'Production à Bruxelles',
    desc: 'Vos boîtes sont produites à Bruxelles. Délai de production : 4 semaines.',
  },
  {
    num: '04',
    title: 'Livraison',
    desc: 'Livraison mensuelle et personnalisée, directement chez vous. Accès à votre espace commande en ligne.',
  },
]

function ProcessStep({ step }) {
  return (
    <div>
      <span
        className="font-syne font-black leading-none select-none block"
        style={{ fontSize: 'clamp(4rem, 6vw, 6rem)', color: 'var(--border)' }}
        aria-hidden="true"
      >
        {step.num}
      </span>
      <h3 className="font-syne font-semibold text-xl mt-2 mb-2">{step.title}</h3>
      <p className="font-mono text-sm text-text2 leading-relaxed">{step.desc}</p>
    </div>
  )
}

export default function ProcessSection() {
  return (
    <section id="process" className="pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="flex-1 h-px bg-[var(--border2)]" />
          <p className="font-mono text-xs uppercase tracking-widest text-text3 whitespace-nowrap">
            Comment ça marche
          </p>
          <span className="flex-1 h-px bg-[var(--border2)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14 md:gap-x-20">
          {STEPS.map((step) => (
            <ProcessStep key={step.num} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
