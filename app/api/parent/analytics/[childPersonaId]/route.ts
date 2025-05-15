import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getAggregatedUsageReport,
  getFavoriteTopicsForPersonaInDateRange,
  getEducationalSuggestions,
} from '@/lib/db/queries'

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
  { params }: { params: { childPersonaId: string } }
) {
  try {
    const session = await auth()
    const userId  = session?.user?.id     ?? null
    const parentPersonaId = session?.user?.parentPersonaId ?? null

    const { childPersonaId } = await params

    if (!(await authorize(childPersonaId, parentPersonaId, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // parse optional ?date=YYYY-MM-DD
    const url       = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    const day       = dateParam ? new Date(dateParam) : new Date()
    const start     = new Date(day)
    start.setUTCHours(0, 0, 0, 0)
    const end       = new Date(day)
    end.setUTCHours(23, 59, 59, 999)

    const usage    = await getAggregatedUsageReport(childPersonaId, start, end)
    const fav      = await getFavoriteTopicsForPersonaInDateRange(childPersonaId, start, end)
    const suggest  = await getEducationalSuggestions(childPersonaId)
    const summary  = `On ${day.toISOString().slice(0,10)}: ${usage.totalMessages} msgs, ${usage.totalChats} chats.`

    return NextResponse.json({
      date: day.toISOString().slice(0,10),
      usage,
      favoriteTopics: fav,
      educationalSuggestions: suggest,
      chatSummary: summary,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
