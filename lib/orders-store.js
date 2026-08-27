// Accès à la table `orders` (cf. supabase/schema.sql). Serveur uniquement.
//
// Cette base est partagée avec le futur dashboard admin : ce module est le seul
// endroit qui écrit des commandes payées, pour qu'il n'y ait qu'une source.
//
// Toutes les fonctions dégradent en silence si Supabase n'est pas configuré —
// le site tourne alors sans persistance, comme avant.

import { getSupabase } from '@/lib/supabase'

// Reconstruit les lignes depuis lib/clients.js et fige prix + sous-totaux au
// moment de l'achat : un changement de tarif ne doit pas réécrire le passé.
export function buildItems(products, quantities) {
  const items = []
  for (const p of products) {
    const qty = parseInt(quantities?.[p.id] ?? 0, 10)
    if (!Number.isFinite(qty) || qty <= 0) continue
    items.push({
      id: p.id,
      fmt: p.fmt,
      qual: p.qual,
      qty,
      unit_price: p.price,
      subtotal_cents: Math.round(qty * p.price * 100),
    })
  }
  return items
}

// Écrit une commande payée. Idempotent : Stripe rejoue ses webhooks, et
// l'index unique sur stripe_session_id fait que le rejeu ne duplique rien.
// Renvoie true si l'écriture a eu lieu (ou était déjà là), false si Supabase
// n'est pas configuré.
export async function recordPaidOrder(order) {
  const supabase = getSupabase()
  if (!supabase) return false

  const { error } = await supabase.from('orders').upsert(
    {
      ref: order.ref,
      client_id: order.clientId,
      client_name: order.clientName,
      items: order.items ?? [],
      total_cents: order.totalCents ?? 0,
      currency: order.currency ?? 'eur',
      delivery_date: order.deliveryDate || null,
      delivery_time: order.deliveryTime || null,
      note: order.note || null,
      source: 'stripe',
      status: 'paid',
      stripe_session_id: order.stripeSessionId,
      paid_at: order.paidAt ?? new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id', ignoreDuplicates: false }
  )

  if (error) throw error
  return true
}

// Historique d'un client, plus récent d'abord. Renvoie [] si Supabase n'est
// pas configuré — l'appelant retombe alors sur le localStorage.
export async function listOrdersForClient(clientId, limit = 20) {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('orders')
    .select('ref, items, total_cents, delivery_date, delivery_time, status, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
