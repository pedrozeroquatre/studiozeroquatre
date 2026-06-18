import { NextResponse } from 'next/server'
import { findClient } from '@/lib/clients'

export async function POST(request) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Code requis' }, { status: 400 })
  }

  // GOOGLE SHEETS HOOK [clients]:
  // Replace findClient(code) with a Sheets lookup.
  // Use unstable_cache({ revalidate: 300 }) to avoid hitting the API on every login.
  const client = findClient(code.trim().toUpperCase())

  if (!client) {
    return NextResponse.json({ error: 'Code invalide. Vérifiez et réessayez.' }, { status: 401 })
  }

  return NextResponse.json(client)
}
