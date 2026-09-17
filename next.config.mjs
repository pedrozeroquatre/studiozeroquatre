/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // L'ancien portail authentifiait sur un code en dur, devinable (le nom du
      // restaurant en majuscules), et rendait derrière lui l'historique de
      // commandes du client. Il est supprimé : l'espace client vit sur /espace,
      // derrière une vraie authentification Supabase.
      //
      // Redirection temporaire (307) et non permanente : un 308 se met en cache
      // dans les navigateurs et serait pénible à défaire.
      { source: '/portal', destination: '/espace', permanent: false },
      { source: '/portal/:path*', destination: '/espace', permanent: false },
    ]
  },
}

export default nextConfig
