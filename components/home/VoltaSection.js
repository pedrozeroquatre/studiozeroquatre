import Image from 'next/image'
import Link from 'next/link'
import FitTitle from './FitTitle'

function PhotoCell({ src, alt }) {
  return (
    <div className="relative overflow-hidden bg-[var(--border)] aspect-[4/3] min-w-0">
      <Image
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'cover' }}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  )
}

export default function VoltaSection() {
  return (
    <section id="volta" className="pt-16 pb-24 px-6 bg-bg">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-8 md:gap-16 md:items-center">
          {/* Text */}
          <div className="min-w-0" style={{ containerType: 'inline-size' }}>
            <p
              className="font-mono text-xs uppercase tracking-widest text-text3 mb-4"
              data-fr="Réalisation"
              data-en="Project"
            >
              Réalisation
            </p>
            <FitTitle text="Volta Supper Club" className="font-syne font-bold mb-6" />
            <p
              className="font-mono text-sm text-text2 max-w-xl leading-relaxed"
              data-fr="Packaging complet pour un restaurant bruxellois exigeant — boîtes pizza kraft, sacs sur mesure et barquettes illustrées qui prolongent l'expérience au-delà de la table."
              data-en="Complete packaging for a demanding Brussels restaurant — kraft pizza boxes, custom bags and illustrated trays that extend the experience beyond the table."
            >
              Packaging complet pour un restaurant bruxellois exigeant — boîtes pizza kraft, sacs sur mesure et barquettes illustrées qui prolongent l&apos;expérience au-delà de la table.
            </p>
          </div>

          {/* Photo */}
          <div>
            <PhotoCell src="/images/volta/volta-01.jpg" alt="Boîte pizza Volta Supper Club" />
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            href="/produits"
            className="inline-block font-mono text-sm px-8 py-4 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity"
            data-fr="Voir tous les produits"
            data-en="See all products"
          >
            Voir tous les produits
          </Link>
        </div>
      </div>
    </section>
  )
}
