'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useScrollBorder } from '@/hooks/useScrollBorder'
import HamburgerMenu from './HamburgerMenu'
import { applyLang } from '@/lib/lang'
import { cn } from '@/lib/cn'

export default function Nav() {
  const scrolled = useScrollBorder()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState('fr')

  function toggleLang() {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    applyLang(next)
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 bg-bg transition-all duration-150',
          scrolled && 'border-b border-[var(--border)]'
        )}
      >
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image
              src="/images/logo.jpg"
              alt="Studio Zeroquatre"
              width={600}
              height={120}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Hamburger */}
          <button
            className="flex flex-col gap-1.5 p-4"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-px bg-text" />
            <span className="block w-5 h-px bg-text" />
            <span className="block w-3.5 h-px bg-text" />
          </button>
        </div>
      </nav>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} lang={lang} onToggleLang={toggleLang} />
    </>
  )
}
