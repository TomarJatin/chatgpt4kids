export const DEFAULT_CHAT_MODEL: string = 'chat-model-large';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-large',
    name: 'Smart AI',
    description: '(Default) Fit for all questions, simple or complex.',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Deep Thinking AI',
    description: 'Uses advanced reasoning. Starts with a "thinking" step, then outputs a more well-thought-out response.',
  },
  {
    id: 'chat-model-small',
    name: 'Fast AI',
    description:
      'Faster, but simpler responses (can be less accurate and thorough than Smart AI).',
  },
];
