'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { WarningDialog } from './warning-dialog';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  childId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  childId?: string;
}) {
  const { mutate } = useSWRConfig();
  const [showWarning, setShowWarning] = useState(false);
  const [warningReason, setWarningReason] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>("Let's talk about something else!");

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel, childPersonaId: childId || '' },
    initialMessages,
    // streamProtocol: 'text', 
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      console.error('error', error);
      toast.error(`An error occured, please try again! (${error.message})`);
    },
    onResponse: async (res) => {
      // Check if this is a JSON response
      const ct = res.headers.get('content-type') || '';
      console.log('🔍 Response Content-Type:', ct);
      
      if (ct.includes('application/json')) {
        console.log('📄 Detected JSON response');
        try {
          // Clone the response to avoid consuming it
          const clonedRes = res.clone();
          const data = await clonedRes.json();
          console.log('📦 Response data:', data);
          
          // Check if the message was blocked
          if (data?.blocked === true) {
            console.log('🚫 Message blocked - Reason:', data.reason);
            
            // Force stop the stream
            console.log('🛑 Stopping stream');
            stop();

            // Set warning data
            setWarningReason(data.reason || 'inappropriate content');
            setWarningMessage(data.message || "Let's talk about something else!");
            setShowWarning(true);
            
            // Return early without value
            return;
          }
        } catch (error) {
          console.error('❌ Error processing JSON response:', error);
          // If it wasn't our JSON or there was an error, stop the stream and recover
          if (ct.includes('application/json')) {
            console.log('🛑 Stopping stream due to JSON parsing error');
            stop();
            setMessages((current) => [...current]); // Force refresh
            
            // Add a fallback response
            console.log('💬 Adding fallback response');
            append({
              id: generateUUID(),
              role: 'assistant',
              content: "I encountered an error processing that message. Let's try something else!",
            });
            
            // Return early without value
            return;
          }
        }
      }
      console.log('✅ Continuing with normal stream processing');
    },
  });

  // NO UPVOTE/DOWNVOTE BECAUSE THIS PRODUCT IS KIDS PRIVACY SENSITIVE
  // const { data: votes } = useSWR<Array<Vote>>(
  //   `/api/vote?chatId=${id}`,
  //   fetcher,
  // );
  const votes: Vote[] = [];

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          selectedChatModel={selectedChatModel}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedChatModel={selectedChatModel}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />

      <WarningDialog
        isOpen={showWarning}
        onClose={handleCloseWarning}
        reason={warningReason}
        message={warningMessage}
      />
    </>
  );
}
