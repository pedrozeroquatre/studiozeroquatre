const LN_P = [
  { id: 'ln_26', fmt: '26×26×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.0883 },
  { id: 'ln_30', fmt: '30×30×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.1086 },
  { id: 'ln_36', fmt: '36×36×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.1447 },
]

export const CLIENTS = {
  ln_etterbeek:  { name: 'Late Night Etterbeek',  code: 'LATENIGHT-ETTERBEEK',  products: LN_P },
  ln_schaerbeek: { name: 'Late Night Schaerbeek',  code: 'LATENIGHT-SCHAERBEEK', products: LN_P },
  ln_anderlecht: { name: 'Late Night Anderlecht',  code: 'LATENIGHT-ANDERLECHT', products: LN_P },
  ln_saintjosse: { name: 'Late Night Saint-Josse', code: 'LATENIGHT-SAINTJOSSE', products: LN_P },
  ln_vilvoorde:  { name: 'Late Night Vilvoorde',   code: 'LATENIGHT-VILVOORDE',  products: LN_P },
  ln_molenbeek:  { name: 'Late Night Molenbeek',   code: 'LATENIGHT-MOLENBEEK',  products: LN_P },
  ln_ixelles:    { name: 'Late Night Ixelles',     code: 'LATENIGHT-IXELLES',    products: LN_P },
  pizza_shake: { name: 'Pizza N Shake', code: 'PIZZASHAKE', products: [
    { id: 'ps_26', fmt: '26×26×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.0883 },
    { id: 'ps_30', fmt: '30×30×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.0924 },
    { id: 'ps_36', fmt: '36×36×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.1447 },
  ]},
  da_toto:  { name: 'Da Toto',     code: 'DATOTO',  products: [{ id: 'dt_33', fmt: '33×33×4cm', qual: 'KBSKB — Blanc/Blanc', price: 0.1656 }] },
  bottega:  { name: 'Bottega',     code: 'BOTTEGA', products: [{ id: 'bo_33', fmt: '33×33×4cm', qual: 'KBSKB — Blanc/Blanc', price: 0.1656 }] },
  bros: { name: 'Bros Pizza', code: 'BROS', products: [
    { id: 'br_30', fmt: '30×30×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1123 },
    { id: 'br_33', fmt: '33×33×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1483 },
  ]},
  arte:    { name: 'Arte',       code: 'ARTE',    products: [{ id: 'ar_33', fmt: '33×33×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1483 }] },
  ballaro: { name: 'Ballarò',    code: 'BALLARO', products: [{ id: 'ba_33', fmt: '33×33×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1483 }] },
  biga:    { name: 'Biga',       code: 'BIGA',    products: [{ id: 'bi_33', fmt: '33×33×4cm', qual: 'TBWK — Blanc/Kraft', price: 0.1224 }] },
  volta:   { name: 'Volta',      code: 'VOLTA',   products: [{ id: 'vo_30', fmt: '30×30×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1123 }] },
  vera:    { name: 'Vera Pizza', code: 'VERA',    products: [{ id: 'vp_33', fmt: '33×33×4cm', qual: 'KBWV — Blanc/Blanc', price: 0.1483 }] },
}

export function findClientByCode(code) {
  const entry = Object.entries(CLIENTS).find(([, c]) => c.code === code)
  if (!entry) return null
  const [id, client] = entry
  return { id, name: client.name, products: client.products }
}

// Used server-side to recompute prices from the source of truth — never trust
// prices or totals sent from the browser.
export function findClientById(id) {
  const client = CLIENTS[id]
  if (!client) return null
  return { id, name: client.name, products: client.products }
}
