'use client'

import { useLayoutEffect, useRef, useState } from 'react'

const LONGEST_WORD = 'Production.'
const MIN_SIZE = 35.2 // px, 2.2rem
const MAX_SIZE = 88 // px, 5.5rem
const FALLBACK = 'clamp(2.2rem, 8.5cqw, 5.5rem)'

export default function FitHeadline() {
  const h1Ref = useRef(null)
  const canvasRef = useRef(null)
  const [fontSize, setFontSize] = useState(null)

  useLayoutEffect(() => {
    const h1 = h1Ref.current
    if (!h1) return

    function fit() {
      const width = h1.clientWidth
      if (!width) return

      const canvas = canvasRef.current || (canvasRef.current = document.createElement('canvas'))
      const ctx = canvas.getContext('2d')
      const computed = getComputedStyle(h1)
      const probeSize = 100
      ctx.font = `${computed.fontWeight} ${probeSize}px ${computed.fontFamily}`
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = computed.letterSpacing
      }

      const naturalWidth = ctx.measureText(LONGEST_WORD).width
      if (!naturalWidth) return

      const fitted = (width / naturalWidth) * probeSize
      setFontSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, fitted)))
    }

    fit()
    document.fonts?.ready.then(fit)

    const ro = new ResizeObserver(fit)
    ro.observe(h1)
    return () => ro.disconnect()
  }, [])

  return (
    <h1
      ref={h1Ref}
      className="font-syne font-black leading-[1.02] tracking-tight mb-8"
      style={{ fontSize: fontSize ? `${fontSize}px` : FALLBACK }}
    >
      <span className="block whitespace-nowrap">Design.</span>
      <span className="block whitespace-nowrap">Production.</span>
      <span className="block whitespace-nowrap">Storage.</span>
      <span className="block whitespace-nowrap" style={{ color: 'var(--text3)' }}>Delivery.</span>
    </h1>
  )
}
