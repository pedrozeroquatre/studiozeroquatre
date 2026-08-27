export const metadata = {
  title: 'Espace clients — Studio Zeroquatre',
  // L'espace est privé : rien à indexer, et les liens d'invitation ne doivent
  // jamais se retrouver dans un moteur de recherche.
  robots: { index: false, follow: false },
}

export default function EspaceLayout({ children }) {
  return <main>{children}</main>
}
