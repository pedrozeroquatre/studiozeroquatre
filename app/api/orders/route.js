import { NextResponse } from 'next/server'
import { generateRef } from '@/lib/generateRef'

export async function POST(request) {
  const body = await request.json()

  // GOOGLE SHEETS HOOK [orders]:
  // 1. npm install googleapis
  // 2. Add env vars: GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), SPREADSHEET_ID, ORDERS_SHEET_NAME
  // 3. Replace console.log with:
  //    import { appendRow } from '@/lib/sheets'
  //    await appendRow(process.env.ORDERS_SHEET_NAME, [ref, new Date().toISOString(), ...fields])
  // Expected body shape: { restaurant, name, email, phone, formats: string[], volume, boxType, notes }
  console.log('[orders] New submission:', JSON.stringify(body, null, 2))

  const ref = generateRef()
  return NextResponse.json({ success: true, ref })
}
