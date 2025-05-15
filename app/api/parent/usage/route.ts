import { NextResponse } from 'next/server'
import { auth }                    from '@/app/(auth)/auth'
import { getChildPersonas, getAggregatedUsageReport } from '@/lib/db/queries'

export async function GET(request: Request) {
  const session  = await auth()
  const userId   = session?.user?.id
  const parentId = session?.user?.parentPersonaId

  if (!userId || !parentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // parse ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to last 7 days)
  const url    = new URL(request.url)
  const fromQs = url.searchParams.get('from')
  const toQs   = url.searchParams.get('to')
  const to     = toQs   ? new Date(toQs)   : new Date()
  const from   = fromQs ? new Date(fromQs) : new Date(to.getTime() - 1000*60*60*24*7)

  // zero-time the bounds
  from.setUTCHours(0,0,0,0)
  to  .setUTCHours(23,59,59,999)

  // fetch all the parent’s children…
  const children = await getChildPersonas(parentId)

  // …then sum each child’s usage over [from→to]
  let totalChats = 0, totalMessages = 0, totalWords = 0
  for (const c of children) {
    const u = await getAggregatedUsageReport(c.id as string, from, to) // TODO: fix this
    totalChats    += u.totalChats
    totalMessages += u.totalMessages
    totalWords    += u.totalWords
  }

  return NextResponse.json({
    from:           from .toISOString().slice(0,10),
    to:             to   .toISOString().slice(0,10),
    totalChats,
    totalMessages,
    totalWords,
  })
}
