'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import pizzaBoxBlank from '@/assets/pizza_box_blank_new.jpeg'
import pizzaBoxDesign from '@/assets/pizza_box_design_new.jpeg'
import burgerBoxBlank from '@/assets/burger_blank_new.jpeg'
import burgerBoxDesign from '@/assets/burger_design_new.jpeg'
import sacKraftBlank from '@/assets/sac_kraft_blank.jpeg'
import sacKraftDesign from '@/assets/sac_kraft_design.jpeg'
import sacKraftSimpleBlank from '@/assets/sac_kraft_no_handle_blank.jpeg'
import sacKraftSimpleDesign from '@/assets/sac_kraft_no_handle_design.jpeg'

const PRODUCTS = [
  {
    id: 'boite-pizza',
    images: [pizzaBoxBlank, pizzaBoxDesign],
    alt: 'Boîte pizza personnalisable',
    name: 'Boîte pizza',
    description: 'Pensée pour préserver la chaleur tout en facilitant le transport et l’empilage.',
    dimensions: ['26 × 26 × 4 cm', '30 × 30 × 4 cm', '33 × 33 × 4 cm', '36 × 36 × 4 cm'],
  },
  {
    id: 'boite-burger',
    images: [burgerBoxBlank, burgerBoxDesign],
    alt: 'Boîte burger personnalisable',
    name: 'Boîte burger',
    description: 'Une structure stable et pratique, adaptée aux burgers généreux et aux menus à emporter.',
    dimensions: ['10 × 10 × 8 cm', '12 × 12 × 10 cm', '15 × 15 × 12 cm'],
  },
  {
    id: 'sac-poignees',
    images: [sacKraftBlank, sacKraftDesign],
    alt: 'Sac à poignées torsadées personnalisable',
    name: 'Sac à poignées',
    description: 'Idéal pour les commandes plus volumineuses, avec un transport confortable et une belle présence en main.',
    dimensions: ['S — 22 × 12 × 22 cm', 'M — 28 × 16 × 28 cm', 'L — 35 × 20 × 32 cm'],
  },
  {
    id: 'sac-kraft',
    images: [sacKraftSimpleBlank, sacKraftSimpleDesign],
    alt: 'Sac kraft simple personnalisable',
    name: 'Sac kraft simple',
    description: 'Une solution légère et économique pour les petites commandes à emporter.',
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
