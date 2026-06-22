'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import FitTitle from './FitTitle'

const slides = [
  {
    title: 'Volta Supper Club',
    text: "Packaging complet pour un restaurant bruxellois exigeant — boîtes pizza kraft, sacs sur mesure et barquettes illustrées qui prolongent l'expérience au-delà de la table.",
    image: '/images/volta/volta-01.jpg',
    alt: 'Boîte pizza Volta Supper Club',
  },
  {
    title: 'La Bottega della Pizza',
    text: "Boîte rose signature pour une pizzeria bruxelloise de caractère — illustration noir et blanc façon encre qui capte l'énergie de l'adresse et la fait voyager jusqu'au client.",
    image: '/images/la_bottega_pizza.jpeg',
    alt: 'Boîte pizza La Bottega della Pizza',
  },
  {
    title: 'Bros Pizza & Bar',
    text: "Packaging affirmé pour Bros Pizza & Bar — codes rouge et blanc, sceau circulaire et typographie bold qui ancrent l'identité visuelle dans un univers de rituels italiens modernes.",
    image: '/images/brospizza_box.jpeg',
    alt: 'Boîte pizza Bros Pizza & Bar',
  },
]

export default function VoltaSection() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const resetTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(i => (i + 1) % slides.length)
    }, 4000)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  const prev = () => { setCurrent(i => (i - 1 + slides.length) % slides.length); resetTimer() }
  const next = () => { setCurrent(i => (i + 1) % slides.length); resetTimer() }

  return (
    <section id="realisations" className="pt-16 pb-24 px-6 bg-bg">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-10">
          Réalisation
        </p>

        {/* Sliding track */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div key={i} className="w-full flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-8 md:gap-16 md:items-center">
                  {/* Text */}
                  <div className="min-w-0" style={{ containerType: 'inline-size' }}>
                    <FitTitle text={slide.title} className="font-syne font-bold mb-6" />
                    <p className="font-mono text-sm text-text2 max-w-xl leading-relaxed">
                      {slide.text}
                    </p>
                  </div>

                  {/* Image */}
                  <div className="relative overflow-hidden bg-[var(--border)] aspect-[4/3] min-w-0">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav row */}
        <div className="flex items-center justify-between mt-10">
          {/* Dots */}
          <div className="flex gap-2 items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); resetTimer() }}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 bg-[var(--text)]'
                    : 'w-2 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-3">
            <button
              onClick={prev}
              aria-label="Précédent"
              className="w-10 h-10 border border-[var(--border)] font-mono text-sm flex items-center justify-center hover:bg-[var(--text)] hover:text-[var(--bg)] hover:border-[var(--text)] transition-colors"
            >
              ←
            </button>
            <button
              onClick={next}
              aria-label="Suivant"
              className="w-10 h-10 border border-[var(--border)] font-mono text-sm flex items-center justify-center hover:bg-[var(--text)] hover:text-[var(--bg)] hover:border-[var(--text)] transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="text-center mt-14">
          <Link
            href="/produits"
            className="inline-block font-mono text-sm px-8 py-4 bg-[var(--text)] text-[var(--bg)] rounded hover:opacity-80 transition-opacity"
          >
            Voir tous les produits
          </Link>
        </div>
      </div>
    </section>
  )
}
