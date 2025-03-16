'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: `What's a day in the life like`,
      label: `for a dolphin in the ocean?`,
      action: `What's a day in the life for a dolphin in the ocean?`,
    },
    {
      title: `Write code to`,
      label: `say "hello, world!" in Python`,
      action: `Write code to say "hello, world!" in Python.`,
    },
    {
      title: `Help me write a poem about`,
      label: `a butterfly and his froggy friends`,
      action: `Help me write a poem about a butterfly and his froggy friends.`,
    },
    {
      title: `Can you explain`,
      label: `how the weather cycle works?`,
      action: 'Can you explain how the weather cycle works?',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={cn(
            index > 1 ? 'hidden sm:block' : 'block',
            // don't let suggestions widen the chat window, instead truncate the text
            'overflow-hidden',
          )}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">
              {suggestedAction.title}
            </span>{" "}
            <span className="text-muted-foreground truncate">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
