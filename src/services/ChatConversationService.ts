import type { ChatMessageModel, ChatToolOptions } from '../models/Chat';
import type { PlannerSnapshot } from '../models/Plan';

export interface ChatPlannerRequestPayload {
  conversationSummary: string;
  history: Array<{
    role: 'assistant' | 'user';
    content: string;
  }>;
  snapshot: PlannerSnapshot;
  toolOptions: ChatToolOptions;
  userInput: string;
}

interface CreateChatSubmissionParams {
  baseMessageCount: number;
  content: string;
  conversationSummary: string;
  messages: ChatMessageModel[];
  pendingMessage: string;
  snapshot: PlannerSnapshot;
  toolOptions: ChatToolOptions;
}

export interface ChatSubmissionDraft {
  assistantMessageId: string;
  nextMessages: ChatMessageModel[];
  request: ChatPlannerRequestPayload;
}

export function createChatSubmission({
  baseMessageCount,
  content,
  conversationSummary,
  messages,
  pendingMessage,
  snapshot,
  toolOptions,
}: CreateChatSubmissionParams): ChatSubmissionDraft {
  const timestamp = Date.now();
  const assistantMessageId = `assistant-${timestamp + 1}`;
  const userMessage: ChatMessageModel = {
    id: `user-${timestamp}`,
    role: 'user',
    content,
  };
  const assistantMessage: ChatMessageModel = {
    id: assistantMessageId,
    role: 'assistant',
    content: pendingMessage,
  };

  return {
    assistantMessageId,
    nextMessages: [...messages, userMessage, assistantMessage],
    request: {
      conversationSummary,
      history: messages.slice(baseMessageCount),
      snapshot,
      toolOptions,
      userInput: content,
    },
  };
}

export function appendAssistantChunk(
  messages: ChatMessageModel[],
  assistantMessageId: string,
  pendingMessage: string,
  chunk: string,
): ChatMessageModel[] {
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content: message.content === pendingMessage ? chunk : `${message.content}${chunk}`,
        }
      : message,
  );
}

export function resolveAssistantReply(
  messages: ChatMessageModel[],
  assistantMessageId: string,
  reply: string,
): ChatMessageModel[] {
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content: reply || '응답이 비어 있습니다. 다시 시도해 주세요.',
        }
      : message,
  );
}

export function resolveAssistantError(
  messages: ChatMessageModel[],
  assistantMessageId: string,
  errorMessage: string,
): ChatMessageModel[] {
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content: message.content
            ? `${message.content}\n\n[연결 오류]\n${errorMessage}`
            : `AI 응답을 가져오지 못했습니다.\n${errorMessage}`,
        }
      : message,
  );
}
