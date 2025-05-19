import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';

import {
  deleteChatById,
  getChatById,
  saveChat,
  getUserById,
  saveMessages,
  getPersonaSettings,
  upsertPersonaSettings,
  getWordFilters,
  flagMessage,
  upsertDailyUsageReport,
  getPersonaById,
  processExtractedTopics,
  getMessageById,
} from '@/lib/db/queries';


import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';

import { systemPromptWithGuardrails } from '@/lib/ai/prompts';
import {
  preProcessUserMessage,
  postProcessLLMResponse,
} from '@/lib/ai/guardRails';
import { extractTopicsFromConversation } from '@/lib/ai/tools/extract-topics';
// import { extractTopicsFromConversation } from '@/lib/ai/tools/extract-tools';

export const maxDuration = 60;

async function authorizeChild(
  childId: string,
  parentPersonaId: string | null,
  userId: string
): Promise<boolean> {
  if (!parentPersonaId) return false;
  const child = await getPersonaById(childId);
  return !!(
    child &&
    child.parentPersonaId === parentPersonaId &&
    child.type === 'child' &&
    child.userId === userId
  );
}

export async function POST(request: Request) {
  try {
    // 1) Auth
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    const userPromise = getUserById(userId);
    const parentPersonaId = session.user.parentPersonaId!;

    const { id, messages, selectedChatModel, childPersonaId }: {
      id: string;
      messages: Message[];
      selectedChatModel: string;
      childPersonaId: string;
    } = await request.json();


    console.log('🌟 childPersonaId', childPersonaId);
    console.log('🌟 parentPersonaId', parentPersonaId);
    console.log('🌟 userId', userId);

    const isAuthorized = await authorizeChild(childPersonaId, parentPersonaId, userId);
    if (!isAuthorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    const personaId = childPersonaId;

    // 2) Load or init parental settings
    let settings = await getPersonaSettings(personaId);
    console.log('🌟 settings', settings);

    const { stripeStatusPaid } = await userPromise;
    if (!stripeStatusPaid) {
      return new Response("Stripe subscription required", { status: 401 });
    }

    if (!settings) {
      await upsertPersonaSettings({
        personaId,
        topicRestriction: 'high',
        violenceFilterLevel: 'high',
        politicsFilterLevel: 'high',
        homeworkMode: false,
        wordFilteringEnabled: true,
        updatedAt: new Date(),
      });
      settings = await getPersonaSettings(personaId)!;
    }

    // 3) Build custom blacklist
    const customWords = settings!.wordFilteringEnabled
      ? (await getWordFilters(personaId)).map((w) => w.word)
      : [];

    console.log('🌟 customWords', customWords);

    // 4) Read request
    

    // 5) Lookup or create chat
    const chat = await getChatById({ id });
    console.log('🌟 chat', chat);
    const userMessage = getMostRecentUserMessage(messages);
    console.log('🌟 userMessage', userMessage);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    if (!chat) {
      const { title, usage } = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({
        chat: { id, title, userId, personaId },
        usage: { chatId: id, msgId: userMessage.id, category: 'chat-title', usage },
      });
    } else if (chat.userId !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 6) Save incoming message (so flagMessage FK is valid)
    // await saveMessages({
    //   messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    // });

    // 7) Pre-filter check
    const pre = preProcessUserMessage(userMessage.content, settings!, customWords);
    console.log('🌟 pre-filter check result:', pre);
    if (!pre.allowed) {
      try {
        console.log('🚫 Message blocked - Reason:', pre.reason);
        
        // Check if message already exists in database before saving
        const existingMessages = await getMessageById({ id: userMessage.id });
        
        // Only save if message doesn't already exist
        if (!existingMessages || existingMessages.length === 0) {
          console.log('💾 Saving blocked message to database:', userMessage.id);
          // Save incoming message before flagging it
          await saveMessages({
            messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
          });
        } else {
          console.log('⚠️ Message already exists in database:', userMessage.id);
        }

        console.log('🚩 Flagging message:', userMessage.id);
        console.log("flagging message", userMessage);
        await flagMessage({
          messageId: userMessage.id,
          flaggedByPersonaId: personaId,
          reason: pre.matched,
          details: pre.reason
        });
        
        console.log('🔄 Returning blocked message response');
        
        // Create a plain Response object with JSON content type
        return new Response(
          JSON.stringify({
            blocked: true,
            message: "Let's talk about something else!",
            reason: pre.reason
          }), 
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
      } catch (err) {
        console.error('❌ Error saving/flagging message:', err);
        
        // Create a plain Response object with JSON content type
        return new Response(
          JSON.stringify({
            blocked: true,
            message: "Let's talk about something else!",
            reason: pre.reason
          }), 
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    // 8) Stream to LLM as usual
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPromptWithGuardrails(selectedChatModel, settings!),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },
          onFinish: async ({ response, reasoning, usage }) => {
            try {
              // 1) sanitize and build finalMessages
              const sanitized = sanitizeResponseMessages({ messages: response.messages, reasoning });
              const finalMessages: Array<{ id: string; role: string; content: any }> = [];
              const flags: Array<{ messageId: string; reason: 'violence' | 'politics' | 'wordFilter' | 'abusive' | 'inappropriate' | string }> = [];
              console.log("sanitized", sanitized);
              console.log("response", response);
              console.log("reasoning", reasoning);
              console.log("usage", usage);
              console.log("finalMessages", finalMessages);
              console.log("flags", flags);
          
              for (const msg of sanitized) {
                if (msg.role === 'assistant') {
                  const text = typeof msg.content === 'string'
                    ? msg.content
                    : msg.content.map((c: any) => ('text' in c ? c.text : '')).join('');
          
                  const { message: filtered, wasFiltered, filterReason } =
                    postProcessLLMResponse(text, settings!, customWords);
                  
                  finalMessages.push({
                    id:    msg.id,
                    role:  msg.role,
                    content: filtered,
                  });
          
                  if (wasFiltered && filterReason) {
                    // buffer the flag until *after* saving
                    flags.push({
                      messageId: msg.id,
                      reason: filterReason,
                    });
                  }
                } else {
                  finalMessages.push({
                    id:      msg.id,
                    role:    msg.role,
                    content: msg.content,
                  });
                }
              }
          
              // 2) save all assistant/tool messages first
              await saveMessages({
                messages: finalMessages.map((m) => ({
                  id:      m.id,
                  chatId:  id,
                  role:    m.role,
                  content: m.content,
                  createdAt: new Date(),
                })),
                usage: {
                  chatId: id,
                  msgId:  userMessage.id,
                  category: 'ai-sdk-chat',
                  usage,
                },
              });
          
              // 3) now it's safe to flag — these message IDs exist in Message table
              for (const { messageId, reason } of flags) {
                await flagMessage({
                  messageId,
                  flaggedByPersonaId: personaId,
                  reason,
                });
              }
          
              // 4) upsert daily usage report (non-blocking)
              const today = new Date().toISOString().slice(0,10);
              // Fire and forget - don't await
              upsertDailyUsageReport({
                personaId:       personaId,
                date:            today,
                chatsStarted:    1,
                messagesSent:    usage.promptTokens + usage.completionTokens,
                wordsSent:       usage.promptTokens + usage.completionTokens,  // approximate word count
              }).catch(err => console.error('Failed to update daily usage report:', err));
          
              // 5) Extract and save topics from the conversation (non-blocking)
              const assistantText = response.messages
                .filter(m => m.role === 'assistant')
                .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
                .join(' ');

              const fullTranscript = 
                messages.map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join(' ')
                + ' ' + assistantText;

              console.log('► Starting topic extraction for chat:', id);
              // Fire and forget - don't await  
              extractTopicsFromConversation(fullTranscript)
                .then((topics: { name: string; relevance: number }[]) => {
                  console.log('► Topics extracted:', topics);
                  return processExtractedTopics(id, topics);
                })
                .then(() => console.log('► Topics processed successfully for chat:', id))
                .catch((err: Error) => console.error('Topic extraction failed:', err));
              
            } catch (err) {
              console.error('onFinish error:', err);
            }
          },


          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();
        result.mergeIntoDataStream(dataStream, { sendReasoning: true });
      },
      onError: () => 'Oops, an error occured!',
    });

  } catch (err: any) {
    console.error('❌ /api/chat error:', err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const personaId = searchParams.get('personaId');

  try {
    const chat = await getChatById({ id });

    if (chat.personaId !== personaId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}