export interface ChatToolOptions {
  planEdit: boolean;
}

export type ChatToolOptionId = keyof ChatToolOptions;

export interface ChatMessageModel {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

export type ChatConnectionState = 'ready' | 'sending' | 'error';

export interface ChatSessionSnapshot {
  connectionState: ChatConnectionState;
  isOpen: boolean;
  isSending: boolean;
  messages: ChatMessageModel[];
  summary: string;
  summarizedMessageCount: number;
  toolOptions: ChatToolOptions;
}
