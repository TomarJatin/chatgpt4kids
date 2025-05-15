import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getPersonasByUserId, getPersonaById, updatePersonaDetails } from '@/lib/db/queries'


export async function GET(request: Request) {
    const session  = await auth()
    const userId   = session?.user?.id
    const parentId = session?.user?.parentPersonaId
  
    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    const parent = await getPersonaById(parentId)
    if (!parent || parent.userId !== userId || parent.type !== 'parent') {
      return NextResponse.json({ error: 'Invalid parent persona' }, { status: 403 })
    }
  
    return NextResponse.json({
      id:          parent.id,
      displayName: parent.displayName,
      avatar:      parent.avatar,
    })
}

export async function PUT(request: Request) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // resolve parentPersonaId from DB
  const personas = await getPersonasByUserId(userId)
  const parent   = personas.find(p => p.type === 'parent')
  const parentId = parent?.id

  if (!parentId) {
    return NextResponse.json({ error: 'Parent persona not found' }, { status: 404 })
  }

    //   double-check ownership
  const existing = await getPersonaById(parentId as string)
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { displayName, avatar, pin } = await request.json()
  const updates: { displayName?: string; avatar?: string; pin?: string } = {}
  if (displayName !== undefined) updates.displayName = displayName
  if (avatar      !== undefined) updates.avatar      = avatar
  if (pin         !== undefined) updates.pin         = pin

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updated = await updatePersonaDetails(parentId as string, updates)
  if (!updated) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // only return safe fields + needsPin flag
  return NextResponse.json({
    id:              updated.id,
    displayName:     updated.displayName,
    type:            updated.type,
    avatar:          updated.avatar,
    parentPersonaId: updated.parentPersonaId,
    needsPin:        updated.type === 'parent' && updated.pinHash == null,
  })
}
