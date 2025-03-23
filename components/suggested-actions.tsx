"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  homeworkMode?: boolean;
}

function PureSuggestedActions({
  chatId,
  append,
  homeworkMode = false,
}: SuggestedActionsProps) {
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
      action: "Can you explain how the weather cycle works?",
    },
  ];

  const suggestedActionsHomework = [
    {
      title: `Solve this multiplication problem:`,
      label: `What is 7 x 8?`,
      action: `Can you help me solve the multiplication problem 7 x 8?`,
    },
    {
      title: `Can you explain`,
      label: `How plants make their food through photosynthesis?`,
      action: `Can you explain how plants make their food through photosynthesis?`,
    },
    {
      title: `Help me write`,
      label: `A short story about a fun day at school.`,
      action: `Help me write a short story about a fun day at school.`,
    },
    {
      title: `Can you explain`,
      label: `How the water cycle works?`,
      action: `Can you explain how the water cycle works in simple terms?`,
    },
  ];

  const suggestions = homeworkMode
    ? suggestedActionsHomework
    : suggestedActions;

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={cn(
            index > 1 ? "hidden sm:block" : "block",
            // don't let suggestions widen the chat window, instead truncate the text
            "overflow-hidden"
          )}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>{" "}
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
