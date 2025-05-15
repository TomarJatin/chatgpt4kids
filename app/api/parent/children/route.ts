import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getChildPersonas,
  createPersona,
} from '@/lib/db/queries'
import { v4 as uuid } from 'uuid'
import { hashSync } from 'bcrypt-ts'

export async function GET(request: Request) {
  try {
    const session  = await auth()
    const userId   = session?.user?.id
    const parentId = session?.user?.parentPersonaId

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await getPersonaById(parentId)
    if (!parent || parent.userId !== userId || parent.type !== 'parent') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const children = await getChildPersonas(parentId)
    return NextResponse.json(children)
  } catch (e) {
    console.error('GET /api/parent/children error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session  = await auth()
    const userId   = session?.user?.id
    const parentId = session?.user?.parentPersonaId

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await getPersonaById(parentId)
    if (!parent || parent.userId !== userId || parent.type !== 'parent') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { displayName, avatar, pin } = await request.json()
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'displayName required' }, { status: 400 })
    }

    const newChild = await createPersona({
      id:               uuid(),
      userId,
      displayName:      displayName.trim(),
      type:             'child',
      avatar:           avatar?.trim() ?? null,
      pinHash:          pin ? hashSync(pin.trim(), 10) : null,
      parentPersonaId:  parentId,
    })

    return NextResponse.json(newChild, { status: 201 })
  } catch (e) {
    console.error('POST /api/parent/children error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
