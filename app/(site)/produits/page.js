'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import doggybag2 from '@/assets/doggy_bag_2.jpeg'
import doggybag1 from '@/assets/doggybag_1.jpeg'
import pizzaBox from '@/assets/CB5B7D13-E332-4052-A09E-F421D9F809DB.PNG'
import voltaPizza from '@/assets/volta_pizza.jpeg'
import burgerBox from '@/assets/burger_box.jpeg'

const PRODUCTS = [
  {
    id: 'boite-pizza',
    images: [pizzaBox, voltaPizza],
    alt: 'Boîte pizza personnalisable',
    name: 'Boîte pizza',
    description: 'Disponible en plusieurs formats, entièrement personnalisable selon votre identité.',
    dimensions: ['28 × 28 × 4 cm', '33 × 33 × 4 cm', '38 × 38 × 4 cm'],
  },
  {
    id: 'boite-burger',
    image: burgerBox,
    alt: 'Boîte burger blanche',
    name: 'Boîte burger',
    description: 'Conçue pour valoriser votre marque, du design à l’impression.',
    dimensions: ['10 × 10 × 8 cm', '12 × 12 × 10 cm', '15 × 15 × 12 cm'],
  },
  {
    id: 'sac-poignees',
    image: doggybag2,
    alt: 'Sac kraft à poignées torsadées',
    name: 'Sac à poignées',
    description: 'Disponible en blanc ou kraft, avec poignées plates ou torsadées.',
    dimensions: ['S — 22 × 12 × 22 cm', 'M — 28 × 16 × 28 cm', 'L — 35 × 20 × 32 cm'],
  },
  {
    id: 'sac-kraft',
    image: doggybag1,
    alt: 'Sac kraft simple sans poignées',
    name: 'Sac kraft simple',
    description: 'Une solution minimaliste, personnalisable dans tous les formats.',
    dimensions: ['S — 14 × 8 × 26 cm', 'M — 18 × 10 × 30 cm', 'L — 24 × 12 × 38 cm'],
  },
]

function ProductImage({ product }) {
  const frames = product.images ?? [product.image]
  const [hover, setHover] = useState(false)
  const active = hover && frames.length > 1 ? 1 : 0

  return (
    <div
      className="relative w-full h-52 sm:w-52 sm:h-52 flex-shrink-0 cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {frames.map((frame, i) => (
        <Image
          key={i}
          src={frame}
          alt={product.alt}
          fill
          style={{
            objectFit: 'contain',
            opacity: i === active ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
          sizes="(max-width: 640px) 100vw, 208px"
        />
      ))}
    </div>
  )
}

function DimensionsToggle({ dimensions }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[var(--border)] pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-text3 hover:text-text2 transition-colors cursor-pointer w-full"
        aria-expanded={open}
      >
        <span>Dimensions</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <ul className="mt-2 space-y-0.5">
            {dimensions.map((dim) => (
              <li key={dim} className="font-mono text-xs text-text2">{dim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ProductStep({ product }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <ProductImage product={product} />
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <h3 className="font-syne font-bold text-xl mb-3">{product.name}</h3>
        <p className="font-mono text-sm text-text2 leading-relaxed">{product.description}</p>
        <div className="mt-6">
          <DimensionsToggle dimensions={product.dimensions} />
        </div>
      </div>
    </div>
  )
}

export default function ProduitsPage() {
  return (
    <div className="min-h-dvh pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Produits */}
        <div className="mb-16">
          <h1 className="font-syne font-bold text-3xl md:text-4xl mb-4">Nos produits</h1>
          <p className="font-mono text-sm text-text2 border-l-2 border-[var(--border2)] pl-4">
            Tous nos emballages sont personnalisables — votre identité, imprimée à chaque commande.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14 md:gap-x-20">
          {PRODUCTS.map((product) => (
            <ProductStep key={product.id} product={product} />
          ))}
        </div>

        {/* Besoin d'autre chose — CTA devis */}
        <div className="mt-20 border-t border-[var(--border)] pt-12 flex flex-col items-center text-center">
          <h2 className="font-syne font-bold text-2xl md:text-3xl mb-4">
            Besoin d’autre chose&nbsp;?
          </h2>
          <p className="font-mono text-sm text-text2 max-w-md mb-8">
            Un format sur mesure, un autre emballage, une impression particulière&nbsp;? Dites-nous ce qu’il vous faut, on s’occupe du reste.
          </p>
          <Link
            href="/devis"
            className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest bg-[var(--text)] text-[var(--bg)] px-8 py-4 hover:opacity-80 transition-opacity"
          >
            Demander un devis
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  )
}
