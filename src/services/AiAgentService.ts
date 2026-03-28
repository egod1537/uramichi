import { createOpenWebUIClient, getOpenWebUIConfig } from '../api/llm';
import type { Poi } from '../models/Poi';
import { buildAiPlannerSystemPrompt } from './AiPlannerPrompt';
import type { ChatToolOptions } from '../models/Chat';
import type { PlannerSnapshot } from '../models/Plan';

interface PlannerChatHistoryMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface PlannerChatRequest {
  conversationSummary?: string;
  history: PlannerChatHistoryMessage[];
  snapshot: PlannerSnapshot;
  toolOptions: ChatToolOptions;
  userInput: string;
}

type PlannerChatChunkHandler = (chunk: string) => void;

interface OpenWebUIMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

const MAX_HISTORY_MESSAGES = 6;
const openWebUIClient = createOpenWebUIClient();

function buildPoiInsightMessages(place: Poi): OpenWebUIMessage[] {
  const placeContext = [
    `장소명: ${place.name}`,
    `카테고리: ${place.tag}`,
    place.detail ? `사용자 설명: ${place.detail}` : '',
    place.summary ? `요약: ${place.summary}` : '',
    place.memo ? `메모: ${place.memo}` : '',
    place.businessHours ? `영업 시간: ${place.businessHours}` : '',
    place.visitTime ? `방문 예정 시간: ${place.visitTime}` : '',
    place.estimatedCost ? `예상 비용: ${place.estimatedCost}` : '',
    `좌표: ${place.position.lat}, ${place.position.lng}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    {
      role: 'system',
      content:
        '당신은 일본 여행 지도 플래너의 POI 설명 도우미다. 장소에 대해 한국어로 짧고 실용적으로 정리한다. 사실 위주로 설명하고 과장하지 말 것. 결과는 최대 4개의 짧은 bullet로 작성하고, 가능하면 볼거리/분위기/실전 팁을 포함한다. 정보가 불확실하면 추정이라고 밝힌다.',
    },
    {
      role: 'user',
      content: `다음 장소를 여행자 관점에서 간단히 정리해줘.\n\n${placeContext}`,
    },
  ];
}

function buildConversationMessages({
  conversationSummary,
  history,
  snapshot,
  toolOptions,
  userInput,
}: PlannerChatRequest): OpenWebUIMessage[] {
  const priorMessages = history
    .filter((message) => message.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map<OpenWebUIMessage>((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  return [
    {
      role: 'system',
      content: buildAiPlannerSystemPrompt(snapshot, toolOptions, conversationSummary),
    },
    ...priorMessages,
    {
      role: 'user',
      content: userInput.trim(),
    },
  ];
}

export function getAiAgentModelName(): string {
  return getOpenWebUIConfig().model;
}

export async function requestAiPlannerReply({
  conversationSummary,
  history,
  snapshot,
  toolOptions,
  userInput,
}: PlannerChatRequest): Promise<string> {
  const reply = await openWebUIClient.chat(
    buildConversationMessages({
      conversationSummary,
      history,
      snapshot,
      toolOptions,
      userInput,
    }),
    { webSearch: true },
  );

  return reply.trim();
}

export async function streamAiPlannerReply(
  { conversationSummary, history, snapshot, toolOptions, userInput }: PlannerChatRequest,
  onChunk: PlannerChatChunkHandler,
): Promise<string> {
  const reply = await openWebUIClient.stream(
    buildConversationMessages({
      conversationSummary,
      history,
      snapshot,
      toolOptions,
      userInput,
    }),
    onChunk,
    { webSearch: true },
  );

  return reply.trim();
}

export async function requestPoiInsight(place: Poi): Promise<string> {
  const reply = await openWebUIClient.chat(buildPoiInsightMessages(place), { webSearch: true });
  return reply.trim();
}
