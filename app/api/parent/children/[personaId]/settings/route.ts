import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getPersonaSettings,
  upsertPersonaSettings,
} from '@/lib/db/queries'
import type { PersonaSettings } from '@/lib/db/schema'

async function authorize(
  childId: string,
  parentPersonaId: string | null,
  userId: string | null
): Promise<boolean> {
  if (!parentPersonaId || !userId) return false
  const child  = await getPersonaById(childId)
  const parent = await getPersonaById(parentPersonaId)
  return !!(
    child &&
    child.type === 'child' &&
    child.parentPersonaId === parentPersonaId &&
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
    const session         = await auth()
    const userId          = session?.user?.id               ?? null
    const parentPersonaId = session?.user?.parentPersonaId  ?? null
    const { personaId }   = await params

    if (!(await authorize(personaId, parentPersonaId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getPersonaSettings(personaId)
    if (!settings) {
      // return defaults for a brand-new child
      return NextResponse.json({
        personaId,
        topicRestriction:    50,
        violenceFilterLevel:    0,
        politicsFilterLevel:    0,
        homeworkMode:           false,
        wordFilteringEnabled:   false,
        updatedAt:              new Date(),
      })
    }

    return NextResponse.json(settings)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Server error fetching settings' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const session         = await auth()
    const userId          = session?.user?.id               ?? null
    const parentPersonaId = session?.user?.parentPersonaId  ?? null
    const { personaId }   = await params

    if (!(await authorize(personaId, parentPersonaId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      topicRestriction,
      violenceFilterLevel,
      politicsFilterLevel,
      homeworkMode,
      wordFilteringEnabled,
    } = body as Partial<PersonaSettings>

    // basic validation
    if (typeof topicRestriction !== 'number' ||
        typeof violenceFilterLevel !== 'number' ||
        typeof politicsFilterLevel !== 'number' ||
        typeof homeworkMode !== 'boolean' ||
        typeof wordFilteringEnabled !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const existing = await getPersonaSettings(personaId)
    const updated: PersonaSettings = {
      personaId,
      topicRestriction:       topicRestriction       ?? existing?.topicRestriction       ?? 50,
      violenceFilterLevel:    violenceFilterLevel    ?? existing?.violenceFilterLevel    ?? 0,
      politicsFilterLevel:    politicsFilterLevel    ?? existing?.politicsFilterLevel    ?? 0,
      homeworkMode:           homeworkMode           ?? existing?.homeworkMode           ?? false,
      wordFilteringEnabled:   wordFilteringEnabled,
      updatedAt:              new Date(),
    }

    await upsertPersonaSettings(updated)
    const saved = await getPersonaSettings(personaId)
    return NextResponse.json(saved)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Server error updating settings' },
      { status: 500 }
    )
  }
}
