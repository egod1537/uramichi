import type { ChatMessageModel, ChatSessionSnapshot } from '../models/Chat';
import { summarizeChatContext } from './ChatContextSummary';

export const initialChatMessages: ChatMessageModel[] = [
  {
    id: 'assistant-1',
    role: 'assistant',
    content:
      '일본 여행 지도 플래너용 AI 에이전트 패널입니다. 일정 수정, 핀 추천, 경비 요약 같은 요청을 여기서 받도록 확장할 수 있습니다.',
  },
];

function createInitialChatSessionSnapshot(): ChatSessionSnapshot {
  return {
    connectionState: 'ready',
    isOpen: false,
    isSending: false,
    messages: initialChatMessages,
    summary: '',
    summarizedMessageCount: 0,
    toolOptions: {
      planEdit: false,
    },
  };
}

class ChatStore {
  private snapshot = createInitialChatSessionSnapshot();

  getSnapshot(): ChatSessionSnapshot {
    return {
      ...this.snapshot,
      messages: this.snapshot.messages.map((message) => ({ ...message })),
      toolOptions: {
        ...this.snapshot.toolOptions,
      },
    };
  }

  replaceSnapshot(
    snapshot: Omit<ChatSessionSnapshot, 'summary' | 'summarizedMessageCount'>,
  ): void {
    const summaryResult = summarizeChatContext(snapshot.messages.slice(initialChatMessages.length));

    this.snapshot = {
      ...snapshot,
      messages: snapshot.messages.map((message) => ({ ...message })),
      summary: summaryResult.summary,
      summarizedMessageCount: summaryResult.summarizedMessageCount,
      toolOptions: {
        ...snapshot.toolOptions,
      },
    };
  }

  reset(): void {
    this.snapshot = createInitialChatSessionSnapshot();
  }
}

export const chatStore = new ChatStore();
