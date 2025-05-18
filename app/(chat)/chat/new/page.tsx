import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { toast } from '@/components/toast';

export default async function Page({ searchParams }: { searchParams: { childPersonaId?: string } }) {
  const id = generateUUID();
  const {childPersonaId} = await searchParams
  if (!childPersonaId) {
    toast({
      type: 'error',
      description: 'No child persona ID provided',
    })
  }
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType="private"
          isReadonly={false}
          childId={childPersonaId || ''}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="private"
        isReadonly={false}
        childId={childPersonaId || ''}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
