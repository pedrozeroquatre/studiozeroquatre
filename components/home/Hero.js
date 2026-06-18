import Image from 'next/image'
import FitHeadline from './FitHeadline'

export default function Hero() {
  return (
    <section className="flex flex-col md:min-h-dvh">
      <div className="flex-1 flex flex-col md:flex-row pt-14 pb-6 md:pb-12">
        {/* Text */}
        <div
          className="md:w-1/2 min-w-0 px-6 md:pl-12 md:pr-10 py-10 flex flex-col md:justify-end"
          style={{ containerType: 'inline-size' }}
        >
          <FitHeadline />

          <p className="font-mono text-sm text-text2 border-l-2 border-[var(--border2)] pl-4 max-w-md">
            Reshaping restaurant identity through packaging.
          </p>
        </div>

        {/* Photos */}
        <div className="md:w-1/2 min-w-0 flex flex-col md:flex-row gap-3 px-6 md:px-0">
          <div className="hidden md:block relative overflow-hidden bg-[var(--border)] h-[40vh] md:h-auto md:flex-[65] min-w-0">
            <Image
              src="/images/hero-main.jpg"
              alt="Packaging Studio Zeroquatre"
              fill
              style={{ objectFit: 'cover' }}
              priority
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="relative overflow-hidden bg-[var(--border)] h-[40vh] md:h-auto md:flex-[35] min-w-0">
            <Image
              src="/images/hero-secondary.jpg"
              alt="Détail packaging Studio Zeroquatre"
              fill
              style={{ objectFit: 'cover' }}
              priority
              sizes="(max-width: 768px) 100vw, 18vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
