// Mémoire locale (par appareil) de la dernière commande d'un client.
//
// Ce n'est plus la source principale : le Dashboard lit d'abord l'historique
// serveur (/api/portal/orders → Supabase), qui suit le client d'un appareil à
// l'autre. Ce store reste le **repli** quand Supabase n'est pas configuré ou
// injoignable, et couvre la commande en cours avant que le webhook Stripe
// n'ait écrit en base.
//
// À supprimer une fois Supabase en place et l'historique repris.

const key = (clientId) => `szq_last_order_${clientId}`

// Returns { quantities: { [productId]: number }, at: number } or null.
export function getLastOrder(clientId) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key(clientId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.quantities !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

// Persists only the positive quantities. No-op if nothing was ordered.
export function saveLastOrder(clientId, quantities) {
  if (typeof window === 'undefined') return
  const clean = {}
  for (const [id, val] of Object.entries(quantities || {})) {
    const n = parseInt(val)
    if (n > 0) clean[id] = n
  }
  if (Object.keys(clean).length === 0) return
  try {
    window.localStorage.setItem(key(clientId), JSON.stringify({ quantities: clean, at: Date.now() }))
  } catch {
    /* storage full or blocked — the shortcut just won't appear next time */
  }
}
