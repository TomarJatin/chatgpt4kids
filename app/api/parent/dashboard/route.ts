import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getChildPersonas,
  getPersonaSettings,
} from '@/lib/db/queries'

export async function GET(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  const parentId = session?.user?.parentPersonaId

  console.log('userId', userId)
  console.log('parentId', parentId)

  if (!userId || !parentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parent = await getPersonaById(parentId)
  if (!parent || parent.userId !== userId || parent.type !== 'parent') {
    return NextResponse.json({ error: 'Invalid parent context' }, { status: 403 })
  }

  const children = await getChildPersonas(parentId)
  const settings = await getPersonaSettings(parentId)

  return NextResponse.json({
    parent: {
      id: parent.id,
      displayName: parent.displayName,
      avatar: parent.avatar,
    },
    children: children.map(c => ({
      id: c.id,
      displayName: c.displayName,
      avatar: c.avatar,
    })),
    settings,
  })
}
