
import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getPersonaById,
  getAggregatedUsageReport,
  getFavoriteTopicsForPersonaInDateRange,
  getEducationalSuggestions,
  getMessageCountForDateRange,
  getFlaggedWordsForPersonaInDateRange,   
  getInterestsForPersonaInDateRange,      
} from '@/lib/db/queries'

async function authorize(childId: string, parentPersonaId: string|null, userId: string|null) {
  if (!parentPersonaId || !userId) return false
  const child  = await getPersonaById(childId)
  const parent = await getPersonaById(parentPersonaId)
  return !!(
    child && child.type==='child' && child.parentPersonaId===parentPersonaId &&
    parent&& parent.userId===userId && parent.type==='parent'
  )
}

export async function GET(request: Request, { params }: { params: { childPersonaId: string } }) {
  try {
    const session         = await auth()
    const userId          = session?.user?.id     ?? null
    const parentPersonaId = session?.user?.parentPersonaId ?? null
    const {childPersonaId}  = await params

    if (!await authorize(childPersonaId, parentPersonaId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // parse ?date=YYYY-MM-DD
    const url       = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    const day       = dateParam ? new Date(dateParam) : new Date()
    const start     = new Date(day); start.setUTCHours(0,0,0,0)
    const end       = new Date(day); end.setUTCHours(23,59,59,999)

    // 1) Aggregates
    const { totalChats, totalWords } =
      await getAggregatedUsageReport(childPersonaId, start, end)
    // real message count (not token sum)
    const totalMessages = await getMessageCountForDateRange(childPersonaId, start, end)
    
    // 2) Favorites & suggestions
    const favTopics   = await getFavoriteTopicsForPersonaInDateRange(childPersonaId, start, end)
    const suggest     = await getEducationalSuggestions(childPersonaId)

    // 3) Flagged words & interests
    const flaggedWords = await getFlaggedWordsForPersonaInDateRange(childPersonaId, start, end)
    const interests    = await getInterestsForPersonaInDateRange(childPersonaId, start, end)

    // 4) Human summary
    const summary = `On ${day.toISOString().slice(0,10)}: ${totalMessages} msgs in ${totalChats} chats.`

    // 5) Send it
    return NextResponse.json({
      date: day.toISOString().slice(0,10),
      usage: {
        totalMessages,
        flaggedWords: flaggedWords.length,
        topicsExplored: favTopics.length,
        newSubjects: suggest.length,
      },
      favoriteTopics: favTopics.map(t => ({
        topicName:  t.topicName!,
        percentage: Math.round(100 * (t.count / (totalMessages||1))),
      })),
      educationalSuggestions: suggest,
      chatSummary: summary,
      flaggedWords,   // array<string>
      interests,      // array<string>
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
