import type { ChatConnectionState, ChatMessageModel, ChatToolOptions } from '../../models/Chat';

export interface ChatPanelProps extends Record<string, never> {}

export interface ChatComposeRequest {
  enablePlanEdit?: boolean;
  message: string;
}

export interface ChatPanelState {
  connectionState: ChatConnectionState;
  isSending: boolean;
  isOpen: boolean;
  messages: ChatMessageModel[];
  toolOptions: ChatToolOptions;
}
