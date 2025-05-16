import { auth } from '@/app/(auth)/auth';
import { preProcessUserMessage } from '@/lib/ai/guardRails';
import { getPersonaSettings, getWordFilters } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1) Auth
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    const personaId = session.user.parentPersonaId!;

    // 2) Load parental settings
    let settings = await getPersonaSettings(personaId);
    if (!settings) {
      return NextResponse.json(
        { allowed: true }, // Default to allowed if settings not found
        { status: 200 }
      );
    }

    // 3) Build custom blacklist
    const customWords = settings.wordFilteringEnabled
      ? (await getWordFilters(personaId)).map((w) => w.word)
      : [];

    // 4) Get the message to validate
    const { message } = await request.json();
    if (!message) {
      return new Response('No message provided', { status: 400 });
    }

    // 5) Validate message
    const result = preProcessUserMessage(message, settings, customWords);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error validating message:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 