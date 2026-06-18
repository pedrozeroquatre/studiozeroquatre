'use client'

import { useLayoutEffect, useRef, useState } from 'react'

const MIN_SIZE = 20 // px
const MAX_SIZE = 48 // px, matches text-5xl
const FALLBACK = 'clamp(1.25rem, 7cqw, 3rem)'

export default function FitTitle({ text, className }) {
  const elRef = useRef(null)
  const canvasRef = useRef(null)
  const [fontSize, setFontSize] = useState(null)

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return

    function fit() {
      const width = el.clientWidth
      if (!width) return

      const canvas = canvasRef.current || (canvasRef.current = document.createElement('canvas'))
      const ctx = canvas.getContext('2d')
      const computed = getComputedStyle(el)
      const probeSize = 100
      ctx.font = `${computed.fontWeight} ${probeSize}px ${computed.fontFamily}`
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = computed.letterSpacing
      }

      const naturalWidth = ctx.measureText(text).width
      if (!naturalWidth) return

      const fitted = (width / naturalWidth) * probeSize
      setFontSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, fitted)))
    }

    fit()
    document.fonts?.ready.then(fit)

    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <h2
      ref={elRef}
      className={`${className} whitespace-nowrap`}
      style={{ fontSize: fontSize ? `${fontSize}px` : FALLBACK }}
      data-fr={text}
      data-en={text}
    >
      {text}
    </h2>
  )
}
