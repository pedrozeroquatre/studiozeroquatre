import { Syne, DM_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Studio Zeroquatre — Packaging sur mesure · Bruxelles',
  description: 'Studio de packaging pour restaurants et hôtels. Boîtes pizza, sacs kraft, barquettes et gobelets personnalisés. Basé à Bruxelles.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
