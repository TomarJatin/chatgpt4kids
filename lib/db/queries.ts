import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray, InferInsertModel, isNull, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

import {
  user,
  persona,
  personaSettings,
  wordFilter,
  chat,
  message,
  messageUsage,
  vote,
  document,
  suggestion,
  flaggedMessage,
  usageReport,
  topic,
  chatTopic,
  favoriteTopic,
  educationalSuggestion,
  type User,
  type Persona,
  type NewPersona,
  type PersonaSettings,
  type WordFilter,
  type NewMessage,
  type NewMessageUsage,
  type Suggestion,
  Chat,
} from './schema';
import { ArtifactKind } from '@/components/artifact';


interface TopicData {
  name: string;
  relevance: number;
}


// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const [row] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!row) {
      throw new Error('User not found');
    }
    return row;
  } catch (error) {
    console.error('Failed to get user by id from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function updateUserStripeStatusPaid({
  userId,
  stripeStatusPaid,
}: {
  userId: string;
  stripeStatusPaid: boolean;
}) {
  try {
    return await db
      .update(user)
      .set({ stripeStatusPaid })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to update user stripe status paid in database");
    throw error;
  }
}

export async function createPersona(data : NewPersona) {
  try{
    await db.insert(persona).values(data);
    return db.select().from(persona).where(eq(persona.id, data.id)).then(rows => rows[0]!);
  }catch(error) {
    console.error("Failed to create persona in database");
    throw error;
  }
}


export async function getPersonaById(id: string): Promise<Persona | null> {
  try {
    const [row] = await db
      .select()
      .from(persona)
      .where(eq(persona.id, id))
      .limit(1);
    return row || null;
  } catch (error) {
    console.error('Failed to get persona by id from database', error);
    throw error;
  }
}

export async function getPersonasByUserId(userId: string): Promise<Persona[]> {
  try {
    return await db
      .select()
      .from(persona)
      .where(eq(persona.userId, userId))
      .orderBy(persona.type)  // optional: parents first
  } catch (error) {
    console.error('Failed to get personas by user from database', error)
    throw error
  }
}

export async function getChildPersonas(parentId: string): Promise<Persona[]> {
  try{
    return await db.select().from(persona).where(eq(persona.parentPersonaId, parentId));
  }catch(error){
    console.error("Failed to get child personas from database");
    throw error;
  }
}

export async function updatePersonaDetails(
  personaId: string,
  data: { displayName?: string; avatar?: string; pin?: string } // PIN is raw here
): Promise<Persona | null> {
  try {
    const currentPersona = await getPersonaById(personaId);
    if (!currentPersona) {
      throw new Error('Persona not found');
    }

    const valuesToUpdate: Partial<Persona> = {};
    if (data.displayName !== undefined) valuesToUpdate.displayName = data.displayName;
    if (data.avatar !== undefined) valuesToUpdate.avatar = data.avatar;
    if (data.pin && currentPersona.type === 'parent') { // Only parents have PINs
      valuesToUpdate.pinHash = hashSync(data.pin, 10);
    }
    valuesToUpdate.updatedAt = new Date();

    if (Object.keys(valuesToUpdate).length === 1 && valuesToUpdate.updatedAt) {
         // Only updatedAt, no actual data changed
         return currentPersona;
    }

    await db.update(persona).set(valuesToUpdate).where(eq(persona.id, personaId));
    return getPersonaById(personaId); // Return the updated persona
  } catch (error) {
    console.error('Failed to update persona details in database', error);
    throw error;
  }
}

export async function deletePersonaById(id: string): Promise<void> {
  try{
    await db.delete(persona).where(eq(persona.id, id));
  }catch(error){
    console.error("Failed to delete persona by id from database");
    throw error;
  }
}

export async function upsertPersonaSettings(settings: PersonaSettings): Promise<void> {
  try{
      const existing = await db
      .select().from(personaSettings)
      .where(eq(personaSettings.personaId, settings.personaId));
    if (existing.length) {
      await db.update(personaSettings)
        .set(settings)
        .where(eq(personaSettings.personaId, settings.personaId));
    } else {
      await db.insert(personaSettings).values(settings);
    }
  }catch(error){
    console.error("Failed to upsert persona settings in database");
    throw error;
  }
}

export async function getPersonaSettings(personaId: string): Promise<PersonaSettings | null> {
  try{
    const [row] = await db
      .select().from(personaSettings)
      .where(eq(personaSettings.personaId, personaId));
    return row || null;
  }catch(error){
    console.error("Failed to get persona settings from database");
    throw error;
  }
}

export async function deletePersonaSettingsByPersonaId(personaId: string) {
  try{
    await db.delete(personaSettings).where(eq(personaSettings.personaId, personaId));
  }catch(error){
    console.error("Failed to delete persona settings by persona id from database");
    throw error;
  }
}

export async function addWordFilter({ personaId, word }: { personaId: string; word: string; }): Promise<WordFilter> {
  try{
    const id = crypto.randomUUID();
    await db.insert(wordFilter).values({ id, personaId, word, createdAt: new Date() });
    return { id, personaId, word, createdAt: new Date() };
  }catch(error){
    console.error("Failed to add word filter to database");
    throw error;
  }
}

export async function getWordFilters(personaId: string): Promise<WordFilter[]> {
  try{
    return await db.select().from(wordFilter).where(eq(wordFilter.personaId, personaId));
  }catch(error){
    console.error("Failed to get word filters from database");
    throw error;
  }
}

export async function removeWordFilter(id: string): Promise<void> {
  try{
    await db.delete(wordFilter).where(eq(wordFilter.id, id));
  }catch(error){
    console.error("Failed to remove word filter from database");
    throw error;
  }
}

export async function saveChat({
  chat: { id, userId, title, personaId },
  usage,
}: {
  chat: {
    id: string;
    userId: string;
    title: string;
    personaId: string;
  };
  usage: NewMessageUsage;
}) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(chat).values({
        id,
        createdAt: new Date(),
        userId,
        title,
        personaId,
      });
      await tx.insert(messageUsage).values(usage);
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}



export async function getChatsByPersonaId({
  personaId,
}: {
  personaId: string
}): Promise<Chat[]> {
  try {
    return await db
      .select()
      .from(chat)
      .where(and(eq(chat.personaId, personaId), isNull(chat.deletedAt)))
      .orderBy(desc(chat.createdAt))
  } catch (error) {
    console.error('Failed to get chats by persona from database', error)
    throw error
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db
      .update(chat)
      .set({ deletedAt: new Date()})
      .where(eq(chat.id, id))
  } catch (error) {
    console.error('Failed to delete chat by id from database', error)
    throw error
  }
}

export async function getChatsByPersonaIdForDateRange(
  personaId: string,
  startDate: Date,
  endDate: Date
): Promise<Chat[]> {
  try {
    return await db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.personaId, personaId),
          gte(chat.createdAt, startDate),
          lte(chat.createdAt, endDate),
          isNull(chat.deletedAt)
        )
      )
      .orderBy(asc(chat.createdAt))
  } catch (error) {
    console.error('Failed to get chats by persona for date range', error)
    throw error
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [row] = await db.select().from(chat).where(eq(chat.id, id))
    return row || null
  } catch (error) {
    console.error('Failed to get chat by id from database', error)
    throw error
  }
}


export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(and(eq(chat.userId, id), isNull(chat.deletedAt)))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

// export async function getChatById({ id }: { id: string }) {
//   try {
//     const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
//     return selectedChat;
//   } catch (error) {
//     console.error('Failed to get chat by id from database');
//     throw error;
//   }
// }

export async function getFavoriteTopicsForPersonaInDateRange(
  personaId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5
): Promise<Array<{ topicName: string | null; count: number }>> {
  try {
    // Subquery to get relevant chat IDs for the persona in the date range
    const relevantChatsQuery = db
      .select({ id: chat.id })
      .from(chat)
      .where(
        and(
          eq(chat.personaId, personaId),
          gte(chat.createdAt, startDate),
          lte(chat.createdAt, endDate),
          isNull(chat.deletedAt)
        )
      );

    const results = await db
      .select({
        topicName: topic.name,
        count: sql<number>`count(${chatTopic.topicId})::int`.as('topic_count'),
      })
      .from(chatTopic)
      .innerJoin(topic, eq(chatTopic.topicId, topic.id))
      .where(inArray(chatTopic.chatId, relevantChatsQuery))
      .groupBy(topic.id, topic.name)
      .orderBy(desc(sql`count(${chatTopic.topicId})`))
      .limit(limit);
    
    return results.map(r => ({ topicName: r.topicName, count: r.count }));

  } catch (error) {
    console.error('Failed to get favorite topics for persona in date range', error);
    throw error;
  }
}

export async function flagMessage({ 
  messageId, 
  flaggedByPersonaId, 
  reason, 
  details 
}: { 
  messageId: string; 
  flaggedByPersonaId: string; 
  reason: any; 
  details?: string; 
}) {
  try {
    console.log('flagging message', messageId, flaggedByPersonaId, reason, details);
    const id = crypto.randomUUID();
    await db.insert(flaggedMessage).values({ 
      id, 
      messageId, 
      flaggedByPersonaId, 
      reason: reason as 'violence' | 'politics' | 'wordFilter' | 'other',
      details: details || null, 
      createdAt: new Date() 
    });
  }catch(error){
    console.error("Failed to flag message in database");
    throw error
  } 
}

export async function getAggregatedUsageReport(
  personaId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalChats: number;
  totalMessages: number;
  totalWords: number;
}> {
  const [row] = await db
    .select({
      totalChats:    sql`SUM(${usageReport.chatsStarted})`,
      totalMessages: sql`SUM(${usageReport.messagesSent})`,
      totalWords:    sql`SUM(${usageReport.wordsSent})`,
    })
    .from(usageReport)
    .where(
      and(
        eq(usageReport.personaId, personaId),
        gte(usageReport.date, startDate.toISOString().split('T')[0]),
        lte(usageReport.date, endDate.toISOString().split('T')[0])
      )
    );
  return {
    totalChats:    Number(row.totalChats ?? 0),
    totalMessages: Number(row.totalMessages ?? 0),
    totalWords:    Number(row.totalWords ?? 0),
  };
}

export async function getFlagsByPersona(personaId: string) {
  try{
    return await db.select().from(flaggedMessage).where(eq(flaggedMessage.flaggedByPersonaId, personaId));
  }catch(error){
    console.error("Failed to get flags by persona from database");
    throw error;
  }
}

export async function insertUsageReport(report: { personaId: string; date: Date; chatsStarted: number; messagesSent: number; wordsSent: number; }) {
  try{
    const id = crypto.randomUUID();
    await db.insert(usageReport).values({ 
      ...report, 
      id, 
      date: report.date.toISOString().split('T')[0],
      createdAt: new Date() 
    });
  }catch(error){
    console.error("Failed to insert usage report in database");
    throw error;
  }
}

export async function getUsageReport(personaId: string, date: Date) {
  try{
    return await db
      .select().from(usageReport)
      .where(and(eq(usageReport.personaId, personaId), eq(usageReport.date, date.toISOString().split('T')[0])));
  }catch(error){
    console.error("Failed to get usage report from database");
    throw error;
  }
}


export async function getAllTopics(limit: number =10, offset: number = 0) {
  try{
    return await db.select().from(topic).limit(limit).offset(offset);
  }catch(error){
    console.error("Failed to get all topics from database");
    throw error;
  }
}

export async function addChatTopic({ chatId, topicId, relevanceScore }: { chatId: string; topicId: string; relevanceScore: number; }) {
  try{
    await db.insert(chatTopic).values({ chatId, topicId, relevanceScore });
  }catch(error){
    console.error("Failed to add chat topic to database");
    throw error;
  }
}


/**
 * Processes and saves topics extracted from conversations
 */
export async function processExtractedTopics(
  chatId: string,
  extractedTopics: TopicData[]
): Promise<void> {
  for (const topicData of extractedTopics) {
    // Find or create the topic
    let topicId;
    try {
      // Search for existing topic with this name
      const existingTopics = await db
        .select()
        .from(topic)
        .where(sql`LOWER(${topic.name}) = LOWER(${topicData.name})`);
      
      if (existingTopics.length > 0) {
        topicId = existingTopics[0].id;
      } else {
        // Create new topic
        topicId = crypto.randomUUID();
        await db.insert(topic).values({
          id: topicId,
          name: topicData.name,
          updatedAt: new Date()
        });
      }
      
      // Check if there's an existing chat-topic relationship
      const existingChatTopics = await db
        .select()
        .from(chatTopic)
        .where(
          and(
            eq(chatTopic.chatId, chatId),
            eq(chatTopic.topicId, topicId)
          )
        );
      
      // Convert decimal relevance score to integer by multiplying by 100
      const relevanceScore = Math.round((topicData.relevance || 1) * 100);
      
      if (existingChatTopics.length > 0) {
        // Update the existing relationship with highest relevance
        await updateChatTopic({
          chatId,
          topicId,
          relevanceScore: Math.max(relevanceScore, existingChatTopics[0].relevanceScore)
        });
      } else {
        // Create a new relationship - handle possible duplicate inserts gracefully
        try {
          await addChatTopic({
            chatId,
            topicId,
            relevanceScore
          });
        } catch (insertError: any) {
          // If this is a duplicate key error, just update the existing record instead
          if (insertError.code === '23505') { // PostgreSQL duplicate key error code
            console.log(`Topic already exists for chat, updating instead: ${chatId}, ${topicId}`);
            await updateChatTopic({
              chatId,
              topicId,
              relevanceScore
            });
          } else {
            // For other errors, rethrow
            throw insertError;
          }
        }
      }
    } catch (error) {
      console.error('Error saving topic:', error);
    }
  }
}

export async function updateChatTopic({ 
  chatId, 
  topicId, 
  relevanceScore 
}: { 
  chatId: string; 
  topicId: string; 
  relevanceScore: number; 
}) {
  try {
    return await db
      .update(chatTopic)
      .set({ 
        relevanceScore,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(chatTopic.chatId, chatId),
          eq(chatTopic.topicId, topicId)
        )
      );
  } catch(error) {
    console.error("Failed to update chat topic in database");
    throw error;
  }
}

export async function getChatTopics(chatId: string) {
  try{
    return await db.select().from(chatTopic).where(eq(chatTopic.chatId, chatId));
  }catch(error){
    console.error("Failed to get chat topics from database");
    throw error;
  }
}

export async function deleteTopic(id: string) {
  try {
    return await db
      .update(topic)
      .set({ deletedAt: new Date() })
      .where(eq(topic.id, id));
  } catch(error) {
    console.error("Failed to delete topic from database");
    throw error;
  }
}

export async function favoriteATopic({ personaId, topicId }: { personaId: string; topicId: string; }) {
  try{
    await db.insert(favoriteTopic).values({ personaId, topicId });
  }catch(error){
    console.error("Failed to favorite a topic in database");
    throw error;
  }
}

export async function getFavoriteTopics(personaId: string) {
  try{
    return await db.select().from(favoriteTopic).where(eq(favoriteTopic.personaId, personaId));
  }catch(error){
    console.error("Failed to get favorite topics from database");
    throw error;
  }
}

export async function addEducationalSuggestion({ personaId, suggestion }: { personaId: string; suggestion: string; }) {
  try{
    const id = crypto.randomUUID();
    await db.insert(educationalSuggestion).values({ id, personaId, suggestion, createdAt: new Date() });
  }catch(error){
    console.error("Failed to add educational suggestion to database");
    throw error;
  }
}

export async function getEducationalSuggestions(personaId: string, limit: number = 10, offset: number = 0) {
  try{
    return await db.select().from(educationalSuggestion).where(eq(educationalSuggestion.personaId, personaId)).limit(limit).offset(offset).orderBy(desc(educationalSuggestion.createdAt));
  }catch(error){
    console.error("Failed to get educational suggestions from database");
    throw error;
  }
}


export async function saveMessages({
  messages,
  usage,
}: {
  messages: Array<InferInsertModel<typeof message>>
  usage?: NewMessageUsage
}) {
  try {
    if (usage) {
      await db.transaction(async (tx) => {
        await tx.insert(message).values(messages)
        await tx.insert(messageUsage).values(usage)
      })
    } else {
      await db.insert(message).values(messages)
    }
  } catch (error) {
    console.error('Failed to save messages in database', error)
    throw error
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt))
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error)
    throw error
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}


export async function upsertDailyUsageReport({
  personaId,
  date,              // YYYY-MM-DD string
  chatsStarted,
  messagesSent,
  wordsSent,
}: {
  personaId:       string
  date:            string
  chatsStarted:    number
  messagesSent:    number
  wordsSent:       number
}) {
  // 1) See if there's already a row for this persona+date
  const [existing] = await db
    .select()
    .from(usageReport)
    .where(
      and(
        eq(usageReport.personaId, personaId),
        eq(usageReport.date, date),
      ),
    )

  if (existing) {
    // 2a) Update the existing row: add our new counts onto what's already there
    await db
      .update(usageReport)
      .set({
        chatsStarted: sql`${usageReport.chatsStarted} + ${chatsStarted}`,
        messagesSent: sql`${usageReport.messagesSent} + ${messagesSent}`,
        wordsSent:    sql`${usageReport.wordsSent} + ${wordsSent}`,
      })
      .where(
        and(
          eq(usageReport.personaId, personaId),
          eq(usageReport.date, date),
        ),
      )
  } else {
    // 2b) Insert a fresh row
    await db.insert(usageReport).values({
      id:            crypto.randomUUID(),
      personaId,
      date,
      chatsStarted,
      messagesSent,
      wordsSent,
      createdAt:     new Date(),
    })
  }
}

// export async function getFlaggedWordsForPersonaInDateRange(
//   personaId: string,
//   start: Date,
//   end:   Date
// ): Promise<string[]> {
//   const rows = await db
//     .select({ details: flaggedMessage.details })
//     .from(flaggedMessage)
//     .where(
//       and(
//         eq(flaggedMessage.flaggedByPersonaId, personaId),
//         gte(flaggedMessage.createdAt, start),
//         lte(flaggedMessage.createdAt, end)
//       )
//     )
//   return rows.map(r => r.details!).filter(Boolean)
// }

export async function getFlaggedWordsForPersonaInDateRange(
  personaId: string,
  start:     Date,
  end:       Date
): Promise<string[]> {
  const rows = await db
    .select({ reason: flaggedMessage.reason })
    .from(flaggedMessage)
    .where(
      and(
        eq(flaggedMessage.flaggedByPersonaId, personaId),
        gte(flaggedMessage.createdAt, start),
        lte(flaggedMessage.createdAt, end),
      )
    );

  // now map over `reason` (never null)
  return rows.map(r => r.reason);
}


export async function getInterestsForPersonaInDateRange(
  personaId: string,
  start: Date,
  end:   Date
): Promise<string[]> {
  // placeholder: replace with your real table
  // e.g. a PersonaInterest table
  return []
}

/**
 * How many messages did this child's chats see in the time window?
 */
export async function getMessageCountForDateRange(
  personaId: string,
  start: Date,
  end:   Date
): Promise<number> {
  const [row] = await db
    .select({ cnt: sql<number>`count(${message.id})::int` })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(and(
      eq(chat.personaId, personaId),
      gte(message.createdAt, start),
      lte(message.createdAt, end)
    ))

  return row.cnt
}

/**
 * Get every "child" persona in the system
 */
export async function getAllChildPersonas(): Promise<Persona[]> {
  return db
    .select()
    .from(persona)
    .where(eq(persona.type, 'child'))
}

/**
 * How many new chats did this child start in the window?
 */
export async function getNewChatCountForDateRange(
  personaId: string,
  start: Date,
  end:   Date
): Promise<number> {
  const [row] = await db
    .select({ cnt: sql<number>`count(${chat.id})::int` })
    .from(chat)
    .where(and(
      eq(chat.personaId, personaId),
      gte(chat.createdAt, start),
      lte(chat.createdAt, end)
    ))

  return row.cnt
}

/**
 * Which chatIds saw at least one message in the window?
 */
export async function getChatIdsByMessageDateRange(
  personaId: string,
  start: Date,
  end:   Date
): Promise<string[]> {
  const rows = await db
    .select({ chatId: message.chatId })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(and(
      eq(chat.personaId, personaId),
      gte(message.createdAt, start),
      lte(message.createdAt, end)
    ))
    .groupBy(message.chatId)

  return rows.map(r => r.chatId)
}

/**
 * Given a chatId, pull back its transcript in the window
 */
export async function getTranscriptForChatInRange(
  chatId: string,
  start:  Date,
  end:    Date
): Promise<string> {
  const rows = await db
    .select({ content: message.content })
    .from(message)
    .where(and(
      eq(message.chatId, chatId),
      gte(message.createdAt, start),
      lte(message.createdAt, end)
    ))
    .orderBy(asc(message.createdAt))

  return rows
    .map(r => typeof r.content === 'string' ? r.content : JSON.stringify(r.content))
    .join(' ')
}