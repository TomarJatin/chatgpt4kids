import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { auth } from '@/app/(auth)/auth'
import { hashSync } from 'bcrypt-ts'
import { getPersonasByUserId, createPersona } from '@/lib/db/queries'

const MAX_CHILDREN = 4

export async function GET(request: Request) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let list = await getPersonasByUserId(userId)
  if (list.length === 0) {
    // first‐time user: auto-create the parent persona
    const parent = await createPersona({
      id: uuid(),
      userId,
      displayName: 'Parent',
      type: 'parent',
      avatar: null,
      pinHash: null,
      parentPersonaId: null,
    })
    list = [parent]
  }

  // only expose what the client needs:
  const safe = list.map((p) => ({
    id:          p.id,
    displayName: p.displayName,
    type:        p.type,
    avatar:      p.avatar,
    needsPin:    p.type === 'parent' && p.pinHash == null,
  }))

  return NextResponse.json(safe)
}

export async function POST(request: Request) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // look up the existing parent in the DB
  const list   = await getPersonasByUserId(userId)
  const parent = list.find((p) => p.type === 'parent' && p.parentPersonaId === null)
  if (!parent) {
    return NextResponse.json({ error: 'Parent persona not found' }, { status: 400 })
  }

  // pull the new child’s data
  const { displayName, avatar, pin } = await request.json()
  if (!displayName) {
    return NextResponse.json({ error: 'displayName is required' }, { status: 400 })
  }

  // enforce max children
  const childCount = list.filter((p) => p.type === 'child').length
  if (childCount >= MAX_CHILDREN) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_CHILDREN} child personas reached.` },
      { status: 403 }
    )
  }

  // create the new child
  const newPersona = await createPersona({
    id:              uuid(),
    userId,
    displayName:     displayName.trim(),
    type:            'child',
    avatar:          avatar?.trim() ?? null,
    pinHash:         pin ? hashSync(pin.trim(), 10) : null,
    parentPersonaId: parent.id,
  })

  // return the same “safe” shape
  return NextResponse.json(
    {
      id:          newPersona.id,
      displayName: newPersona.displayName,
      type:        newPersona.type,
      avatar:      newPersona.avatar,
      needsPin:    false,
    },
    { status: 201 }
  )
}
