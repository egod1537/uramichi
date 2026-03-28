import type { ChatConnectionState } from '../../models/Chat';

export const quickPrompts = [
  '3일차에 시부야 야경 일정 추가해줘',
  '센소지에서 아키하바라까지 대중교통 경로 추천',
  '오늘 일정 예상 경비 계산해줘',
];

export const pendingAssistantMessage = '답변을 준비 중입니다...';

export function buildChatStatusLabel(
  connectionState: ChatConnectionState,
  modelName: string,
): string {
  if (connectionState === 'sending') {
    return '응답 생성 중';
  }

  if (connectionState === 'error') {
    return '연결 확인 필요';
  }

  return `${modelName} 연결됨`;
}
