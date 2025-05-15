import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getPersonaById } from '@/lib/db/queries'
import { compareSync } from 'bcrypt-ts'

export async function POST(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { personaId, pin } = await request.json()
  if (!personaId || !pin) {
    return NextResponse.json({ error: 'personaId and pin required' }, { status: 400 })
  }

  const pers = await getPersonaById(personaId)
  if (!pers || pers.userId !== userId || pers.type !== 'parent') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (typeof pers.pinHash !== 'string' || !compareSync(pin, pers.pinHash)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
