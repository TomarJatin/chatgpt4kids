import { NextResponse } from 'next/server'
import { auth }        from '@/app/(auth)/auth'
import {
  getChildPersonas,
  getAggregatedUsageReport,
  getFavoriteTopicsForPersonaInDateRange,
  getEducationalSuggestions,
} from '@/lib/db/queries'

export async function GET(request: Request) {
  const session  = await auth()
  const userId   = session?.user?.id
  const parentId = session?.user?.parentPersonaId

  if (!userId || !parentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // parse ?date=YYYY-MM-DD (defaults to today)
  const url       = new URL(request.url)
  const dateQs    = url.searchParams.get('date')
  const day       = dateQs ? new Date(dateQs) : new Date()
  const start     = new Date(day); start.setUTCHours(0,0,0,0)
  const end       = new Date(day); end.setUTCHours(23,59,59,999)

  // gather all children
  const children = await getChildPersonas(parentId)

  // for each child, build its summary
  const summaries = await Promise.all(children.map(async (c) => {
    const cid = c.id as string  // TODO: fix this
    const usage       = await getAggregatedUsageReport(cid, start, end)
    const favorites   = await getFavoriteTopicsForPersonaInDateRange(cid, start, end)
    const suggestions = await getEducationalSuggestions(cid)
    const chatSummary = `On ${day.toISOString().slice(0,10)}: ${usage.totalMessages} messages across ${usage.totalChats} chats.`

    return {
      childId:     c.id,
      displayName: c.displayName,
      avatar:      c.avatar,
      date:        day.toISOString().slice(0,10),
      usage,
      favoriteTopics:          favorites,
      educationalSuggestions:  suggestions,
      chatSummary,
    }
  }))

  return NextResponse.json({ summaries })
}
