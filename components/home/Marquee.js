'use client'
import { useEffect, useRef } from 'react'

const ITEMS = [
  'STUDIO ZEROQUATRE',
  '·',
  'PACKAGING SUR MESURE',
  '·',
  'BOÎTES PIZZA',
  '·',
  'SACS KRAFT',
  '·',
  'BARQUETTES',
  '·',
  'GOBELETS',
  '·',
  'BRUXELLES',
  '·',
]

export default function Marquee() {
  const trackRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = mq.matches ? 'paused' : 'running'
    }
  }, [])

  const content = (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="font-mono text-xs tracking-widest whitespace-nowrap px-4">
          {item}
        </span>
      ))}
    </>
  )

  return (
    <section className="bg-[#0a0a0a] text-white py-4 overflow-hidden" aria-hidden="true">
      <div ref={trackRef} className="marquee-track flex w-max">
        {content}
        {content}
      </div>
    </section>
  )
}
