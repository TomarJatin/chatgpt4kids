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
        topicRestriction:     'medium',
        violenceFilterLevel:  'low',
        politicsFilterLevel:  'low',
        homeworkMode:         false,
        wordFilteringEnabled: false,
        updatedAt:            new Date(),
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

    // basic validation - using the enum values from the schema
    if ((topicRestriction !== undefined && !['low', 'medium', 'high'].includes(topicRestriction)) || 
        (violenceFilterLevel !== undefined && !['low', 'medium', 'high'].includes(violenceFilterLevel)) || 
        (politicsFilterLevel !== undefined && !['low', 'medium', 'high'].includes(politicsFilterLevel)) || 
        (homeworkMode !== undefined && typeof homeworkMode !== 'boolean') || 
        (wordFilteringEnabled !== undefined && typeof wordFilteringEnabled !== 'boolean')
    ) {

      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const existing = await getPersonaSettings(personaId)
    const updated: PersonaSettings = {
      personaId,
      topicRestriction:       topicRestriction       ?? existing?.topicRestriction       ?? 'medium',
      violenceFilterLevel:    violenceFilterLevel    ?? existing?.violenceFilterLevel    ?? 'low',
      politicsFilterLevel:    politicsFilterLevel    ?? existing?.politicsFilterLevel    ?? 'low',
      homeworkMode:           homeworkMode           ?? existing?.homeworkMode           ?? false,
      wordFilteringEnabled:   wordFilteringEnabled ?? existing?.wordFilteringEnabled ?? false,
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
