import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getWordFilters,
  addWordFilter,
  removeWordFilter,
} from '@/lib/db/queries'

async function authorize(
  childId: string,
  parentId: string,
  userId: string
): Promise<boolean> {
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

export async function GET(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    // 1) grab session
    const session = await auth()
    const userId = session?.user?.id
    const parentId = session?.user?.parentPersonaId

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await params

    // 2) check child-belongs-to-this-parent
    if (!(await authorize(personaId, parentId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3) fetch & return
    const filters = await getWordFilters(personaId)
    return NextResponse.json(filters)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const parentId = session?.user?.parentPersonaId

    if (!userId || !parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await params

    if (!(await authorize(personaId, parentId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { word } = await request.json()
    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json({ error: 'Word required' }, { status: 400 })
    }

    const added = await addWordFilter({
      personaId: personaId,
      word: word.trim(),
    })

    return NextResponse.json(added, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
