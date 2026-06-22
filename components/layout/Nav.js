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
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
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

          {/* Desktop links */}
          <div className="hidden md:flex items-center" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="hidden md:block font-mono text-xs px-3 py-2 text-text2 hover:text-text transition-colors relative after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-text after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
              data-fr="Espace clients"
              data-en="Client portal"
            >
              Espace clients
            </Link>

            <button
              onClick={toggleLang}
              className="font-mono text-xs text-text3 hover:text-text2 transition-colors hidden md:block"
              aria-label="Changer de langue"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="flex md:hidden flex-col gap-1.5 p-1"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <span className="block w-5 h-px bg-text" />
              <span className="block w-5 h-px bg-text" />
              <span className="block w-3.5 h-px bg-text" />
            </button>
          </div>
        </div>
      </nav>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
