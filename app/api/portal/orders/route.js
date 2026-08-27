import { NextResponse } from 'next/server'
import { findClientByCode } from '@/lib/clients'
import { listOrdersForClient } from '@/lib/orders-store'

// Historique des commandes d'un client.
//
// L'authentification se fait par le **code d'accès**, jamais par clientId : les
// identifiants ('volta', 'bros'…) sont devinables, on ne veut pas qu'un slug
// bien tapé donne l'historique et les volumes d'un restaurant.
export async function POST(request) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Code requis' }, { status: 400 })
  }

  const client = findClientByCode(String(code).trim().toUpperCase())
  if (!client) {
    return NextResponse.json({ error: 'Code incorrect.' }, { status: 401 })
  }

  try {
    const orders = await listOrdersForClient(client.id)
    return NextResponse.json({ orders })
  } catch (err) {
    // L'historique est un confort : s'il tombe, le portail doit rester
    // commandable. On renvoie une liste vide plutôt qu'une erreur bloquante.
    console.error('[portal/orders] lecture échouée', err)
    return NextResponse.json({ orders: [] })
  }
}
