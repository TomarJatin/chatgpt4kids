import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getPersonaById, removeWordFilter } from '@/lib/db/queries'

async function authorize(
  childId: string,
  parentId: string | null,
  userId: string | null
) {
  if (!parentId || !userId) return false
  const child  = await getPersonaById(childId)
  const parent = await getPersonaById(parentId)
  return !!(
    child &&
    child.type === 'child' &&
    child.parentPersonaId === parentId &&
    parent &&
    parent.userId === userId &&
    parent.type === 'parent'
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: { childPersonaId: string; wordFilterId: string } }
) {
  try {
    // grab session info
    const session      = await auth()
    const userId       = session?.user?.id ?? null
    const parentId     = session?.user?.parentPersonaId ?? null
    const { childPersonaId, wordFilterId } = params

    // check access
    if (!(await authorize(childPersonaId, parentId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // perform delete
    await removeWordFilter(wordFilterId)
    return NextResponse.json(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/parent/children/[childPersonaId]/wordfilter/[wordFilterId] error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
