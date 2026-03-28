import type { ChatMessageModel } from '../models/Chat';

const SUMMARY_TRIGGER_MESSAGE_COUNT = 12;
const RECENT_MESSAGE_COUNT = 6;
const SUMMARY_TURN_COUNT = 8;
const SUMMARY_TEXT_LIMIT = 140;

interface ChatTurn {
  assistant: string[];
  user: string[];
}

export interface ChatContextSummaryResult {
  recentMessages: ChatMessageModel[];
  summarizedMessageCount: number;
  summary: string;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function pushTurn(turns: ChatTurn[], turn: ChatTurn | null): void {
  if (!turn) {
    return;
  }

  if (!turn.user.length && !turn.assistant.length) {
    return;
  }

  turns.push(turn);
}

function buildChatTurns(messages: ChatMessageModel[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let currentTurn: ChatTurn | null = null;

  messages.forEach((message) => {
    const content = normalizeText(message.content);

    if (!content) {
      return;
    }

    if (message.role === 'user') {
      pushTurn(turns, currentTurn);
      currentTurn = {
        assistant: [],
        user: [content],
      };
      return;
    }

    if (!currentTurn) {
      currentTurn = {
        assistant: [content],
        user: [],
      };
      return;
    }

    currentTurn.assistant.push(content);
  });

  pushTurn(turns, currentTurn);

  return turns;
}

function formatTurnSummary(turn: ChatTurn, index: number): string {
  const userText = truncateText(turn.user.join(' / '), SUMMARY_TEXT_LIMIT);
  const assistantText = truncateText(turn.assistant.join(' / '), SUMMARY_TEXT_LIMIT);

  if (userText && assistantText) {
    return `${index + 1}. 요청: ${userText} | 응답: ${assistantText}`;
  }

  if (userText) {
    return `${index + 1}. 요청: ${userText}`;
  }

  return `${index + 1}. 응답: ${assistantText}`;
}

export function summarizeChatContext(messages: ChatMessageModel[]): ChatContextSummaryResult {
  const normalizedMessages = messages.filter((message) => normalizeText(message.content));
  const recentMessages = normalizedMessages.slice(-RECENT_MESSAGE_COUNT);
  const olderMessages = normalizedMessages.slice(0, Math.max(normalizedMessages.length - RECENT_MESSAGE_COUNT, 0));

  if (normalizedMessages.length <= SUMMARY_TRIGGER_MESSAGE_COUNT || !olderMessages.length) {
    return {
      recentMessages,
      summarizedMessageCount: 0,
      summary: '',
    };
  }

  const turns = buildChatTurns(olderMessages);
  const selectedTurns = turns.slice(-SUMMARY_TURN_COUNT);
  const summaryLines = selectedTurns.map((turn, index) => formatTurnSummary(turn, index));

  return {
    recentMessages,
    summarizedMessageCount: olderMessages.length,
    summary: summaryLines.length
      ? ['이전 대화 요약', ...summaryLines].join('\n')
      : '',
  };
}
