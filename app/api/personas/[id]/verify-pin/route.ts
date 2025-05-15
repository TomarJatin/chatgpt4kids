import { NextResponse } from 'next/server'
import { getPersonaById } from '@/lib/db/queries'
import { compareSync } from 'bcrypt-ts'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { pin } = await request.json()
  const pers = await getPersonaById(params.id)
  if (!pers) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  const pinHash = pers.pinHash
  if (typeof pinHash !== 'string' || !compareSync(pin, pinHash)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
