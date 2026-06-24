'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import doggybag2 from '@/assets/doggy_bag_2.jpeg'
import doggybag1 from '@/assets/doggybag_1.jpeg'
import pizzaBox from '@/assets/blank_pizza_box.jpeg'
import burgerBox from '@/assets/burger_box.jpeg'

const BEST_SELLERS = [
  {
    id: 'boite-pizza',
    image: pizzaBox,
    alt: 'Boîte pizza blanche',
    name: 'Boîte pizza',
    description: 'Boîte pizza en carton ondulé blanc, solide et isolante.',
    dimensions: ['28 × 28 × 4 cm', '33 × 33 × 4 cm', '38 × 38 × 4 cm'],
  },
  {
    id: 'boite-burger',
    image: burgerBox,
    alt: 'Boîte burger blanche',
    name: 'Boîte burger',
    description: 'Boîte burger compacte en carton rigide, maintien optimal.',
    dimensions: ['10 × 10 × 8 cm', '12 × 12 × 10 cm', '15 × 15 × 12 cm'],
  },
  {
    id: 'sac-poignees',
    image: doggybag2,
    alt: 'Sac kraft à poignées torsadées',
    name: 'Sac à poignées',
    description: 'Sac kraft blanc à poignées torsadées, idéal pour le take-away.',
    dimensions: ['S — 22 × 12 × 22 cm', 'M — 28 × 16 × 28 cm', 'L — 35 × 20 × 32 cm'],
  },
  {
    id: 'sac-kraft',
    image: doggybag1,
    alt: 'Sac kraft simple sans poignées',
    name: 'Sac kraft simple',
    description: 'Sac papier sans poignées, classique et fonctionnel.',
    dimensions: ['S — 14 × 8 × 26 cm', 'M — 18 × 10 × 30 cm', 'L — 24 × 12 × 38 cm'],
  },
]

const CATALOGUE = [
  { id: 'barquette',    category: 'Barquettes', name: 'Barquette alimentaire', description: 'Barquette en carton kraft pour plats chauds et salades.',           dimensions: ['S — 12 × 9 × 4 cm', 'M — 16 × 12 × 5 cm', 'L — 22 × 16 × 6 cm'] },
  { id: 'gobelet',      category: 'Gobelets',   name: 'Gobelet carton',        description: 'Gobelet simple paroi pour boissons froides et chaudes.',            dimensions: ['20 cl', '30 cl', '45 cl'] },
  { id: 'boite-salade', category: 'Boîtes',     name: 'Boîte salade',          description: 'Boîte rectangulaire à couvercle transparent pour bowls et salades.', dimensions: ['500 ml', '750 ml', '1 000 ml'] },
  { id: 'manchette',    category: 'Accessoires', name: 'Manchette café',        description: 'Manchette en carton isolant pour gobelet chaud.',                   dimensions: ['Universelle — ⌀ 8 cm'] },
  { id: 'pot-sauce',    category: 'Accessoires', name: 'Pot à sauce',           description: 'Petit pot en carton avec couvercle snap pour sauces et dips.',      dimensions: ['60 ml', '120 ml', '200 ml'] },
  { id: 'boite-sushi',  category: 'Boîtes',     name: 'Boîte sushi',           description: 'Boîte compartimentée à couvercle pour sushis et makis.',            dimensions: ['S — 20 × 10 × 4 cm', 'L — 26 × 18 × 4 cm'] },
  { id: 'sac-sandwich', category: 'Sacs',        name: 'Sac sandwich',          description: 'Pochette kraft fenêtrée pour sandwichs, wraps et paninis.',         dimensions: ['14 × 6 × 28 cm', '18 × 8 × 32 cm'] },
  { id: 'serviette',    category: 'Accessoires', name: 'Serviette ouate',       description: 'Serviette en papier ouate de cellulose, imprimable en couleur.',    dimensions: ['25 × 25 cm (1 pli)', '33 × 33 cm (2 plis)', '40 × 40 cm (3 plis)'] },

  { id: 'boite-frites',     category: 'Boîtes',      name: 'Boîte à frites',    description: 'Boîte conique en carton pour frites et snacks.',                   dimensions: ['S — ⌀ 7 × 9 cm', 'M — ⌀ 9 × 11 cm', 'L — ⌀ 11 × 14 cm'] },
  { id: 'boite-wrap',       category: 'Boîtes',      name: 'Boîte wrap',        description: 'Étui rectangulaire en carton pour wraps et burritos.',              dimensions: ['22 × 9 × 9 cm', '27 × 11 × 11 cm'] },
  { id: 'boite-tacos',      category: 'Boîtes',      name: 'Boîte tacos',       description: 'Boîte en carton avec maintien vertical intégré pour tacos.',        dimensions: ['12 × 8 × 12 cm', '15 × 10 × 15 cm'] },
  { id: 'boite-hotdog',     category: 'Boîtes',      name: 'Boîte hot-dog',     description: 'Étui allongé en carton isolant pour hot-dogs et sandwichs chauds.', dimensions: ['22 × 7 × 7 cm', '26 × 8 × 8 cm'] },
  { id: 'boite-donuts',     category: 'Boîtes',      name: 'Boîte donuts',        description: 'Boîte fenêtrée en carton pour donuts et viennoiseries.',           dimensions: ['1 pièce — 12 × 12 × 6 cm', '4 pièces — 26 × 13 × 6 cm', '6 pièces — 34 × 13 × 6 cm'] },
  { id: 'boite-gateau',     category: 'Boîtes',      name: 'Boîte gâteau',        description: 'Boîte haute en carton à fond renforcé pour gâteaux entiers.',        dimensions: ['15 × 15 × 12 cm', '20 × 20 × 15 cm', '25 × 25 × 18 cm'] },
  { id: 'boite-pates',      category: 'Boîtes',      name: 'Boîte pâtes & bowls', description: 'Boîte carrée avec couvercle pour pâtes, risottos et bowls.',         dimensions: ['500 ml', '750 ml', '1 000 ml'] },
  { id: 'sac-isotherme',    category: 'Sacs',        name: 'Sac isotherme',       description: 'Sac de livraison isotherme en non-tissé, anse renforcée.',           dimensions: ['S — 20 × 15 × 20 cm', 'M — 30 × 22 × 25 cm', 'L — 40 × 30 × 30 cm'] },
  { id: 'sachet-papier',    category: 'Sacs',        name: 'Sachet papier',       description: 'Sachet en papier kraft à fermeture pliée pour boulangerie.',         dimensions: ['S — 10 × 5 × 18 cm', 'M — 14 × 7 × 24 cm', 'L — 18 × 9 × 30 cm'] },
  { id: 'barquette-fri',    category: 'Barquettes',  name: 'Barquette friterie',  description: 'Barquette ouverte en carton ondulé pour frites et nuggets.',         dimensions: ['S — 10 × 7 × 4 cm', 'M — 14 × 10 × 5 cm', 'L — 18 × 13 × 6 cm'] },
  { id: 'gobelet-glace',    category: 'Gobelets',    name: 'Gobelet glace',       description: 'Gobelet évasé en carton pour glaces et desserts froids.',            dimensions: ['120 ml', '200 ml', '300 ml'] },
  { id: 'plateau-repas',    category: 'Accessoires', name: 'Plateau repas',       description: 'Plateau en carton compartimenté pour menus complets.',               dimensions: ['28 × 22 × 3 cm', '35 × 28 × 3 cm'] },
  { id: 'paille-papier',    category: 'Accessoires', name: 'Paille papier',       description: 'Paille en papier kraft résistante à l\'humidité, écologique.',       dimensions: ['⌀ 6 mm × 20 cm', '⌀ 8 mm × 24 cm'] },
  { id: 'couverts-bois',    category: 'Accessoires', name: 'Couverts bois',       description: 'Set couvert en bouleau FSC — fourchette, couteau, cuillère.',        dimensions: ['Longueur 16 cm', 'Longueur 19 cm'] },
  { id: 'manchette-pizza',  category: 'Accessoires', name: 'Manchette pizza',     description: 'Manchette de maintien pour boîtes pizza, avec zone d\'impression.',  dimensions: ['Pour boîtes 28 cm', 'Pour boîtes 33 cm', 'Pour boîtes 38 cm'] },
  { id: 'sous-verre',       category: 'Accessoires', name: 'Sous-verre carton',     description: 'Sous-verre en carton recyclé, imprimable 4 couleurs. Finition vernie ou mate, idéal pour bars et cafés.',    dimensions: ['⌀ 9 cm', '⌀ 10.5 cm'] },
]

const CATEGORIES = ['Tout', 'Boîtes', 'Sacs', 'Barquettes', 'Gobelets', 'Accessoires']
const PER_PAGE = 8

function DimensionsToggle({ dimensions }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[var(--border)] pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-text3 hover:text-text2 transition-colors cursor-pointer w-full"
        aria-expanded={open}
      >
        <span>Dimensions</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <ul className="mt-2 space-y-0.5">
            {dimensions.map((dim) => (
              <li key={dim} className="font-mono text-xs text-text2">{dim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function BestSellerCard({ product }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row overflow-hidden">
      <div className="relative sm:w-52 flex-shrink-0 bg-white h-52 sm:h-auto">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          style={{ objectFit: 'contain', padding: '16px' }}
          sizes="(max-width: 640px) 100vw, 208px"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 p-6">
        <div className="flex-1">
          <h3 className="font-syne font-bold text-xl mb-3">{product.name}</h3>
          <p className="font-mono text-sm text-text2 leading-relaxed">{product.description}</p>
        </div>
        <div className="mt-6">
          <DimensionsToggle dimensions={product.dimensions} />
        </div>
      </div>
    </div>
  )
}

function CatalogueCard({ product }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] flex flex-row overflow-hidden">
      <div className="w-24 flex-shrink-0 bg-white flex items-center justify-center">
        <div className="w-10 h-10 border border-[var(--border)]" />
      </div>
      <div className="flex flex-col flex-1 min-w-0 p-4">
        <div className="flex-1">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-1">{product.category}</p>
          <h3 className="font-syne font-semibold text-sm mb-2 leading-snug">{product.name}</h3>
          <p className="font-mono text-xs text-text2 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        </div>
        <div className="mt-4">
          <DimensionsToggle dimensions={product.dimensions} />
        </div>
      </div>
    </div>
  )
}

export default function ProduitsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tout')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return CATALOGUE.filter((p) => {
      const matchesCat = activeCategory === 'Tout' || p.category === activeCategory
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [search, activeCategory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  function handleFilter(cat) {
    setActiveCategory(cat)
    setPage(1)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-dvh pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Best sellers */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-3">Nos produits</p>
          <h1 className="font-syne font-bold text-3xl md:text-4xl mb-4">Meilleures ventes</h1>
          <p className="font-mono text-sm text-text2 border-l-2 border-[var(--border2)] pl-4">
            Tous nos emballages sont personnalisables — votre identité, imprimée à chaque commande.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
          {BEST_SELLERS.map((product) => (
            <BestSellerCard key={product.id} product={product} />
          ))}
        </div>

        {/* Catalogue header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="flex-1 h-px bg-[var(--border2)]" />
          <p className="font-mono text-xs uppercase tracking-widest text-text3 whitespace-nowrap">Catalogue complet</p>
          <span className="flex-1 h-px bg-[var(--border2)]" />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Rechercher un produit…"
              className="w-full border border-[var(--border)] bg-[var(--surface)] font-mono text-sm pl-9 pr-4 py-2.5 outline-none focus:border-[var(--border2)] transition-colors placeholder:text-text3"
            />
          </div>
        </div>

        {/* Sidebar + Grid */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Filter sidebar */}
          <aside className="md:w-44 flex-shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">Filtrer</p>
            <div className="flex flex-row flex-wrap md:flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilter(cat)}
                  className={`font-mono text-xs text-left px-3 py-2 border transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {visible.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {visible.map((product) => (
                  <CatalogueCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border border-[var(--border)]">
                <p className="font-mono text-sm text-text3">Aucun produit trouvé.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="font-mono text-xs px-3 py-2 border border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`font-mono text-xs px-3 py-2 border transition-colors cursor-pointer ${
                      n === currentPage
                        ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="font-mono text-xs px-3 py-2 border border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  →
                </button>
                <span className="font-mono text-xs text-text3 ml-1">
                  {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
