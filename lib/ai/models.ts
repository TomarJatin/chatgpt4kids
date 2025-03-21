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
    description: 'Default — fit for all questions, simple or complex.',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Deep Thinking AI',
    description: 'Uses advanced reasoning — starts with a "thinking" step, then outputs a thought-out response.',
  },
  {
    id: 'chat-model-small',
    name: 'Fast AI',
    description:
      'Faster than Smart AI, but can be less accurate & detailed.',
  },
  {
    id: 'chat-model-homework',
    name: 'Homework Mode',
    description: 'Helps with homework by guiding students through problems step-by-step without giving direct answers.',
  },
];
