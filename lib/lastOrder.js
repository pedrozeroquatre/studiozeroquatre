// Local, per-device memory of a client's last order — used to power the
// "Refaire ma dernière commande" shortcut in the portal.
//
// This is a temporary store. When the real order history lands (Supabase,
// fed by the Stripe webhook + the client's historical data), swap these two
// functions for server reads/writes — the Dashboard only depends on this
// interface, not on localStorage directly.

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
