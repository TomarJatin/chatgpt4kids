import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  updatePersonaDetails,
  deletePersonaById,
} from '@/lib/db/queries'

export async function PUT(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const session = await auth()
    const userId   = session?.user?.id
    const parentId = session?.user?.parentPersonaId
    const { personaId } = await params

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const target = await getPersonaById(personaId)
    if (!target) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // allow parent→self or parent→child
    const canEdit =
      // updating parent record?
      (target.type === 'parent'
        && target.id === parentId
        && target.userId === userId)
      ||
      // updating one of their children?
      (target.type === 'child'
        && target.parentPersonaId === parentId
        && target.userId === userId)

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { displayName, avatar, pin } = await request.json()
    const updates: Record<string, any> = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (avatar      !== undefined) updates.avatar      = avatar
    if (pin         !== undefined) updates.pin         = pin  // updatePersonaDetails will hash

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 })
    }

    const updated = await updatePersonaDetails(personaId, updates)
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const session = await auth()
    const userId   = session?.user?.id
    const parentId = session?.user?.parentPersonaId
    const { personaId } = params

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const target = await getPersonaById(personaId)
    if (!target) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // only allow deleting children (never the parent record itself)
    const canDelete =
      target.type === 'child'
      && target.parentPersonaId === parentId
      && target.userId === userId

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deletePersonaById(personaId)
    return NextResponse.json(null, { status: 204 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
