/** @type {import('next').NextConfig} */

// En-têtes de sécurité.
//
// Aucun ne répare une faille existante : ils ferment d'avance des classes
// entières d'attaques, et c'est ce que regarde un audit.
//
// Pas de Content-Security-Policy complète ici : Next injecte ses propres
// scripts en ligne, et une politique posée à l'aveugle casserait le site sans
// prévenir. Seule `frame-ancestors` est posée — elle ne dépend d'aucun script
// et ne peut rien casser.
const ENTETES = [
  // Le site ne doit jamais être chargé dans un cadre invisible sur un autre
  // site : c'est la technique du clic détourné, où un client croit cliquer sur
  // un bouton anodin et valide en fait un paiement dans son espace.
  // Les deux en-têtes disent la même chose, l'un pour les navigateurs récents,
  // l'autre pour les anciens.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },

  // « Ne devine pas le type d'un fichier » : un fichier déposé par un visiteur
  // ne doit pas pouvoir être interprété comme du code.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // L'adresse complète de la page n'est transmise qu'à nous-mêmes ; un site
  // tiers n'apprend que le domaine d'où vient le visiteur.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Le site n'a besoin ni de la caméra, ni du micro, ni de la position.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

  // « Ne me parle plus jamais en clair », pendant un an.
  //
  // Volontairement SANS `includeSubDomains` ni `preload` : les deux engagent
  // pour des mois tout ce qui pourrait un jour vivre sur un sous-domaine, et
  // se défont difficilement (il faut republier max-age=0 et attendre que les
  // navigateurs repassent). Le domaine du site est protégé, c'est ce qui est
  // demandé aujourd'hui.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: ENTETES }]
  },

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
