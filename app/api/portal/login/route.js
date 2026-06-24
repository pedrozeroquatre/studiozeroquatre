import { NextResponse } from 'next/server'
import { findClientByCode } from '@/lib/clients'

export async function POST(request) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Code requis' }, { status: 400 })
  }

  const client = findClientByCode(code.trim().toUpperCase())

  if (!client) {
    return NextResponse.json({ error: 'Code incorrect.' }, { status: 401 })
  }

  return NextResponse.json(client)
}
