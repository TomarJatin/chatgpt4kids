import { NextResponse } from 'next/server'
import {
  getAllChildPersonas,
  getNewChatCountForDateRange,
  getMessageCountForDateRange,
  getChatIdsByMessageDateRange,
  getTranscriptForChatInRange,
  getFlaggedWordsForPersonaInDateRange,
  getInterestsForPersonaInDateRange,
  upsertDailyUsageReport,
  processExtractedTopics
} from '@/lib/db/queries'
import { extractTopicsFromConversation } from '@/lib/ai/tools/extract-tools'

export async function GET() {
  console.log('⌚️ cron triggered at', new Date().toISOString())

  const now   = new Date()
  const end   = now
  const start = new Date(now.getTime() - 1000 * 60 * 60)

  const children = await getAllChildPersonas()
  for (const child of children) {
    const personaId = child.id!
    const chatsStarted = await getNewChatCountForDateRange(personaId as string, start, end)
    const messagesSent = await getMessageCountForDateRange(personaId as string, start, end)
    const flaggedWords = await getFlaggedWordsForPersonaInDateRange(personaId as string, start, end)
    const interests    = await getInterestsForPersonaInDateRange(personaId as string, start, end)

    await upsertDailyUsageReport({
      personaId: personaId as string,
      date:      start.toISOString().slice(0,10),
      chatsStarted,
      messagesSent,
      wordsSent: messagesSent,
    })

    const chatIds = await getChatIdsByMessageDateRange(personaId as string, start, end)
    for (const chatId of chatIds) {
      const transcript = await getTranscriptForChatInRange(chatId, start, end)
      console.log("Transacript: ", transcript)
      const topics     = await extractTopicsFromConversation(transcript)
      console.log("Topics: ", topics)
      await processExtractedTopics(chatId, topics)
    }

    console.log(
      `✅ persona=${personaId} → chats:${chatsStarted}, msgs:${messagesSent}, ` +
      `flags:${flaggedWords.length}, interests:${interests.length}`
    )
  }

  return NextResponse.json({ success: true })
}
