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

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1) Auth
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    const personaId = session.user.parentPersonaId!;

    // 2) Load or init parental settings
    let settings = await getPersonaSettings(personaId);
    if (!settings) {
      await upsertPersonaSettings({
        personaId,
        topicRestriction: 'high',
        violenceFilterLevel: 'high',
        politicsFilterLevel: 'high',
        homeworkMode: false,
        wordFilteringEnabled: false,
        updatedAt: new Date(),
      });
      settings = await getPersonaSettings(personaId)!;
    }

    // 3) Build custom blacklist
    const customWords = settings!.wordFilteringEnabled
      ? (await getWordFilters(personaId)).map((w) => w.word)
      : [];

    // 4) Read request
    const { id, messages, selectedChatModel }: {
      id: string;
      messages: Message[];
      selectedChatModel: string;
    } = await request.json();

    // 5) Lookup or create chat
    const chat = await getChatById({ id });
    const userMessage = getMostRecentUserMessage(messages);
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
    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    // 7) Pre-filter check
    const pre = preProcessUserMessage(userMessage.content, settings!, customWords);
    if (!pre.allowed) {
      await flagMessage({
        messageId: userMessage.id,
        flaggedByPersonaId: personaId,
        reason: pre.reason!,
      });
      return NextResponse.json(
        { allowed: false, message: "Let’s talk about something else!" },
        { status: 200 }
      );
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
              : ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'],
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
              // sanitize SDK artifacts
              const sanitized = sanitizeResponseMessages({ messages: response.messages, reasoning });
              const finalMessages: typeof sanitized = [];

              for (const msg of sanitized) {
                if (msg.role === 'assistant') {
                  const text = typeof msg.content === 'string'
                    ? msg.content
                    : msg.content.map((c: any) => ('text' in c ? c.text : '')).join('');
                  const { message: filtered, wasFiltered, filterReason } =
                    postProcessLLMResponse(text, settings!, customWords);
                  if (wasFiltered) {
                    await flagMessage({
                      messageId: msg.id,
                      flaggedByPersonaId: personaId,
                      reason: filterReason!,
                    });
                  }
                  finalMessages.push({ ...msg, content: filtered });
                } else {
                  finalMessages.push(msg);
                }
              }

              // persist assistant/tool messages
              await saveMessages({
                messages: finalMessages.map((m) => ({
                  id: m.id,
                  chatId: id,
                  role: m.role,
                  content: m.content,
                  createdAt: new Date(),
                })),
                usage: { chatId: id, msgId: userMessage.id, category: 'ai-sdk-chat', usage },
              });
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