'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function HamburgerMenu({ open, onClose, lang, onToggleLang }) {
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        ref={drawerRef}
        className="relative z-10 w-72 h-full bg-bg flex flex-col p-8 gap-6 border-l border-[var(--border)]"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation mobile"
      >
        <button
          onClick={onClose}
          className="self-end text-text2 hover:text-text font-mono text-xs uppercase tracking-widest"
          aria-label="Fermer le menu"
        >
          ✕ Fermer
        </button>

        <div className="flex flex-col gap-5 mt-4">
          <Link
            href="/contact"
            onClick={onClose}
            className="font-mono text-sm text-text hover:text-text2 transition-colors"
            data-fr="Contact"
            data-en="Contact"
          >
            Contact
          </Link>
          <Link
            href="/portal"
            onClick={onClose}
            className="font-mono text-sm text-text hover:text-text2 transition-colors"
            data-fr="Espace clients"
            data-en="Client portal"
          >
            Espace clients
          </Link>
        </div>

        <button
          onClick={onToggleLang}
          className="mt-auto font-mono text-xs text-text3 hover:text-text2 transition-colors self-start"
          aria-label="Changer de langue"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </nav>
    </div>
  )
}
