import { NextResponse } from 'next/server'
import { findClient } from '@/lib/clients'

export async function POST(request) {
  const { clientId, code } = await request.json()

  if (!clientId || !code) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const client = findClient(clientId, code.trim().toUpperCase())

  if (!client) {
    return NextResponse.json({ error: 'Code incorrect.' }, { status: 401 })
  }

  return NextResponse.json(client)
}
