import type { ChatToolOptions } from '../models/Chat';
import type { DayLayer, PlannerSnapshot } from '../models/Plan';
import type { DaySegment } from '../models/Route';
import { formatClock } from '../shared/utils/time';

interface SerializablePlannerSnapshot {
  currentDayId: string;
  currentDayLabel: string;
  currentTime: string;
  planMeta: PlannerSnapshot['planMeta'];
  selectedPlaceName: string | null;
  days: Array<{
    id: string;
    label: string;
    meta: string;
    timelineRange: string;
    places: Array<{
      name: string;
      tag: string;
      iconId: string;
      visitTime: string;
      businessHours: string;
      estimatedCost: string;
    }>;
    segments: Array<{
      type: DaySegment['type'];
      label: string;
      timeRange: string;
    }>;
  }>;
}

function serializeDaySegment(segment: DaySegment) {
  return {
    type: segment.type,
    label: segment.label,
    timeRange: `${formatClock(segment.start)} ~ ${formatClock(segment.end)}`,
  };
}

function serializeDay(day: DayLayer): SerializablePlannerSnapshot['days'][number] {
  return {
    id: day.id,
    label: day.label,
    meta: day.meta,
    timelineRange: `${formatClock(day.timelineRange.start)} ~ ${formatClock(day.timelineRange.end)}`,
    places: day.places.map((place) => ({
      name: place.name,
      tag: place.tag,
      iconId: place.iconId,
      visitTime: place.visitTime,
      businessHours: place.businessHours,
      estimatedCost: place.estimatedCost,
    })),
    segments: day.segments.map(serializeDaySegment),
  };
}

function createSerializableSnapshot(snapshot: PlannerSnapshot): SerializablePlannerSnapshot {
  const selectedPlace =
    snapshot.allPlaces.find((place) => place.id === snapshot.activePlaceId) ?? null;

  return {
    currentDayId: snapshot.currentDayId,
    currentDayLabel: snapshot.currentDay.label,
    currentTime: formatClock(snapshot.currentMinutes),
    planMeta: snapshot.planMeta,
    selectedPlaceName: selectedPlace?.name ?? null,
    days: snapshot.dayLayers.map(serializeDay),
  };
}

export function buildAiPlannerSystemPrompt(
  snapshot: PlannerSnapshot,
  toolOptions: ChatToolOptions,
  conversationSummary = '',
): string {
  const serializedSnapshot = JSON.stringify(createSerializableSnapshot(snapshot), null, 2);
  const toolInstructions = [
    '웹 검색은 항상 활성화되어 있습니다. 최신성이 중요한 내용은 확인된 정보와 추정을 구분해 설명하세요.',
    toolOptions.planEdit
      ? '여행 계획 수정 모드가 켜져 있습니다. 사용자가 일정 변경을 원하면 현재 플래너 상태를 기준으로 추가, 삭제, 시간 이동, 경로 재구성 제안을 구체적으로 작성하세요.'
      : '여행 계획 수정 모드는 꺼져 있습니다. 일정 변경을 단정하지 말고 질문에 대한 설명, 추천, 검토 중심으로 답변하세요.',
  ];

  return [
    '당신은 일본 여행 지도 플래너를 돕는 AI 에이전트입니다.',
    '항상 한국어로 답변하고, 현재 플래너 상태를 근거로 짧고 실행 가능하게 설명하세요.',
    '현재 UI는 채팅 답변만 연결되어 있으므로, 일정이 실제로 자동 반영되었다고 단정하지 말고 "적용 제안" 또는 "추천안" 형태로 설명하세요.',
    '경로, 비용, 영업시간을 추정할 때는 추정이라는 점을 분명히 밝히세요.',
    '답변이 길어지면 먼저 결론 1~2문장만 말하고, 필요한 세부사항만 짧게 덧붙이세요.',
    ...toolInstructions,
    conversationSummary.trim() ? '이전 대화 요약:' : '',
    conversationSummary.trim(),
    '현재 플래너 상태 JSON:',
    serializedSnapshot,
  ]
    .filter(Boolean)
    .join('\n');
}
