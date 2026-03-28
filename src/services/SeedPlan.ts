import type { DayLayer, DayTab, PlanMeta, PlannerData } from '../models/Plan';
import type { CategoryId, LegendItem, Poi, PoiIconId } from '../models/Poi';
import type { DaySegment, MapDrawing, TimelineRange } from '../models/Route';
import { CATEGORY_ICON_IDS, getCategoryVisual } from '../shared/constants/categories';
import { buildDefaultMapDrawing } from '../shared/utils/mapDrawings';

interface SeedPlaceInput extends Omit<Poi, 'id' | 'dayId' | 'color' | 'iconId'> {
  iconId?: PoiIconId;
}

function createPlace(dayId: string, key: string, data: SeedPlaceInput): Poi {
  return {
    id: `${dayId}-${key}`,
    dayId,
    color: getCategoryVisual(data.tag).color,
    iconId: data.iconId ?? data.tag,
    ...data,
  };
}

function createTimelineRange(start: number, end: number): TimelineRange {
  return { start, end };
}

function formatClock(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');

  return `${hour}:${minute}`;
}

function createPoiSegment(
  dayId: string,
  key: string,
  place: Poi,
  start: number,
  end: number,
): DaySegment {
  return {
    id: `${dayId}-${key}`,
    type: 'poi',
    placeId: place.id,
    label: place.name,
    start,
    end,
    color: place.color,
  };
}

function createTransitSegment(
  dayId: string,
  key: string,
  label: string,
  start: number,
  end: number,
  color = getCategoryVisual('교통').color,
): DaySegment {
  return {
    id: `${dayId}-${key}`,
    type: 'travel',
    label,
    start,
    end,
    color,
  };
}

function createFreeSegment(dayId: string, key: string, label: string, start: number, end: number): DaySegment {
  return {
    id: `${dayId}-${key}`,
    type: 'free',
    label,
    start,
    end,
    color: '#94a3b8',
  };
}

function createRouteDrawing(
  dayId: string,
  key: string,
  dayLabel: string,
  dayMeta: string,
  places: Poi[],
  timelineRange: TimelineRange,
): MapDrawing {
  const drawing = buildDefaultMapDrawing(
    dayLabel,
    `${dayId}-${key}`,
    0,
    places.map((place) => place.position),
    'polyline',
    'itinerary',
  );

  return {
    ...drawing,
    detail: `${dayMeta} 이동 경로`,
    estimatedCost: '교통비 미정',
    timeText: `${formatClock(timelineRange.start)} ~ ${formatClock(timelineRange.end)}`,
  };
}

const day1Places: Poi[] = [
  createPlace('day1', 'tokyo-station', {
    name: '도쿄역',
    tag: '교통',
    position: { lat: 35.6812, lng: 139.7671 },
    zoom: 12,
    summary: '도착 직후 환승과 수하물 정리를 끝내는 출발 허브입니다.',
    detail: 'JR 환승, 공항 이동, 출발 포인트',
    visitTime: '08:40 ~ 09:00',
    businessHours: '항시 운영',
    estimatedCost: '¥0',
    memo: '코인락커 위치와 IC카드 충전을 먼저 처리',
  }),
  createPlace('day1', 'sensoji', {
    name: '센소지',
    tag: '관광',
    position: { lat: 35.7148, lng: 139.7967 },
    zoom: 14,
    summary: '아사쿠사 오전 동선의 중심. 이른 시간 방문이 가장 여유롭습니다.',
    detail: '오전 관광, 카미나리몬, 나카미세 거리',
    visitTime: '09:30 ~ 10:45',
    businessHours: '06:00 ~ 17:00',
    estimatedCost: '¥0',
    memo: '참배 후 나카미세 거리에서 간식 구간 확보',
  }),
  createPlace('day1', 'akihabara', {
    name: '아키하바라',
    tag: '쇼핑',
    position: { lat: 35.6984, lng: 139.773 },
    zoom: 14,
    summary: '전자상가와 서브컬처 상점을 묶은 점심 이후 메인 스팟입니다.',
    detail: '점심 후 쇼핑, 피규어샵, 카페',
    visitTime: '11:10 ~ 13:00',
    businessHours: '11:00 ~ 20:00',
    estimatedCost: '¥2,500',
    memo: '전자상가, 피규어샵, 아케이드 순서로 이동',
  }),
  createPlace('day1', 'shibuya-sky', {
    name: '시부야 스카이',
    tag: '야간',
    position: { lat: 35.6593, lng: 139.7005 },
    zoom: 15,
    summary: '야경 확인용 포인트. 해 질 무렵 입장으로 설정한 상태입니다.',
    detail: '야경, 전망대, 저녁 동선',
    visitTime: '18:30 ~ 20:00',
    businessHours: '10:00 ~ 22:30',
    estimatedCost: '¥2,200',
    memo: '일몰 시간대 입장권 확인 필요',
  }),
];

const day2aPlaces: Poi[] = [
  createPlace('day2a', 'ueno-park', {
    name: '우에노 공원',
    tag: '관광',
    position: { lat: 35.7156, lng: 139.773 },
    zoom: 14,
    summary: '동도쿄 루트의 오전 산책 구간입니다.',
    detail: '공원 산책, 박물관 외부 동선',
    visitTime: '09:00 ~ 10:20',
    businessHours: '05:00 ~ 23:00',
    estimatedCost: '¥0',
    memo: '벚꽃 시즌 혼잡도 높음',
  }),
  createPlace('day2a', 'ameyoko', {
    name: '아메요코',
    tag: '음식',
    position: { lat: 35.7098, lng: 139.7742 },
    zoom: 15,
    summary: '브런치와 시장 탐방을 같이 묶은 밀도 높은 구간입니다.',
    detail: '시장 골목, 브런치, 길거리 간식',
    visitTime: '10:35 ~ 11:50',
    businessHours: '10:00 ~ 20:00',
    estimatedCost: '¥1,600',
    memo: '시장 골목 사진 포인트 체크',
  }),
  createPlace('day2a', 'animate-ikebukuro', {
    name: '애니메이트 이케부쿠로',
    tag: '쇼핑',
    position: { lat: 35.7302, lng: 139.7193 },
    zoom: 15,
    summary: '오타쿠 테마 분기에서 가장 오래 머무는 쇼핑 포인트입니다.',
    detail: '굿즈 쇼핑, 만다라케 연계 가능',
    visitTime: '12:25 ~ 15:00',
    businessHours: '11:00 ~ 21:00',
    estimatedCost: '¥4,000',
    memo: '구매 예산 상한선 따로 잡기',
  }),
];

const day2bPlaces: Poi[] = [
  createPlace('day2b', 'meiji-jingu', {
    name: '메이지 신궁',
    tag: '관광',
    position: { lat: 35.6764, lng: 139.6993 },
    zoom: 14,
    summary: '서도쿄 대안 루트의 차분한 오전 시작점입니다.',
    detail: '신사, 숲길 산책, 오전 방문',
    visitTime: '09:30 ~ 11:00',
    businessHours: '06:20 ~ 17:20',
    estimatedCost: '¥0',
    memo: '입구에서 본전까지 도보 시간 반영',
  }),
  createPlace('day2b', 'harajuku-cafe', {
    name: '하라주쿠 카페',
    tag: '음식',
    position: { lat: 35.6691, lng: 139.7037 },
    zoom: 15,
    summary: '브런치와 휴식 구간을 겸하는 짧은 스탑입니다.',
    detail: '브런치, 커피, 쇼핑 전 휴식',
    visitTime: '11:10 ~ 11:55',
    businessHours: '09:00 ~ 19:00',
    estimatedCost: '¥1,400',
    memo: '테이크아웃이면 15분 단축 가능',
  }),
  createPlace('day2b', 'shinjuku-gyoen', {
    name: '신주쿠 교엔',
    tag: '관광',
    position: { lat: 35.6852, lng: 139.71 },
    zoom: 14,
    summary: '도심 공원 위주로 걷는 대안 루트의 핵심 포인트입니다.',
    detail: '도보 산책, 정원, 휴식',
    visitTime: '12:20 ~ 14:20',
    businessHours: '09:00 ~ 16:00',
    estimatedCost: '¥500',
    memo: '월요일 휴무 체크 필요',
  }),
  createPlace('day2b', 'hotel-gracery', {
    name: '호텔 그레이서리',
    tag: '숙소',
    position: { lat: 35.694, lng: 139.7034 },
    zoom: 15,
    summary: '체크인과 짐 정리 기준점으로 쓰는 숙소 핀입니다.',
    detail: '체크인, 짐 보관, 저녁 출발점',
    visitTime: '20:00 ~ 20:30',
    businessHours: '항시 운영',
    estimatedCost: '¥15,000',
    memo: '체크인 줄 길면 15분 추가',
  }),
];

const legendItems: LegendItem[] = [
  ...CATEGORY_ICON_IDS.map((id: CategoryId) => ({
    id,
    label: getCategoryVisual(id).label,
    color: getCategoryVisual(id).color,
  })),
];

const dayLayers: DayLayer[] = [
  {
    id: 'day1',
    label: 'Day 1',
    meta: '도쿄 도착',
    drawings: [
      createRouteDrawing(
        'day1',
        'seed-itinerary',
        'Day 1',
        '도쿄 도착',
        day1Places,
        createTimelineRange(8 * 60 + 30, 21 * 60),
      ),
    ],
    places: day1Places,
    timelineRange: createTimelineRange(8 * 60 + 30, 21 * 60),
    segments: [
      createPoiSegment('day1', 'tokyo-station-stop', day1Places[0], 8 * 60 + 40, 9 * 60),
      createTransitSegment('day1', 'to-sensoji', '긴자선 · 아사쿠사 30분', 9 * 60, 9 * 60 + 30),
      createPoiSegment('day1', 'sensoji-stop', day1Places[1], 9 * 60 + 30, 10 * 60 + 45),
      createTransitSegment('day1', 'to-akiba', 'JR 야마노테선 · 20분', 10 * 60 + 45, 11 * 60 + 5),
      createPoiSegment('day1', 'akiba-stop', day1Places[2], 11 * 60 + 10, 13 * 60),
      createFreeSegment('day1', 'midday-gap', '자유시간', 13 * 60, 18 * 60),
      createPoiSegment('day1', 'shibuya-stop', day1Places[3], 18 * 60 + 30, 20 * 60),
    ],
  },
  {
    id: 'day2a',
    label: 'Day 2A',
    meta: '동도쿄 루트',
    variantGroupId: 'day2',
    variantGroupLabel: 'Day 2',
    variantLabel: 'A',
    drawings: [
      createRouteDrawing(
        'day2a',
        'seed-itinerary',
        'Day 2A',
        '동도쿄 루트',
        day2aPlaces,
        createTimelineRange(8 * 60 + 30, 17 * 60 + 30),
      ),
    ],
    places: day2aPlaces,
    timelineRange: createTimelineRange(8 * 60 + 30, 17 * 60 + 30),
    segments: [
      createPoiSegment('day2a', 'ueno-stop', day2aPlaces[0], 9 * 60, 10 * 60 + 20),
      createTransitSegment('day2a', 'to-ameyoko', '도보 이동 · 15분', 10 * 60 + 20, 10 * 60 + 35),
      createPoiSegment('day2a', 'ameyoko-stop', day2aPlaces[1], 10 * 60 + 35, 11 * 60 + 50),
      createTransitSegment('day2a', 'to-ikebukuro', 'JR 야마노테선 · 25분', 11 * 60 + 55, 12 * 60 + 20),
      createPoiSegment('day2a', 'animate-stop', day2aPlaces[2], 12 * 60 + 25, 15 * 60),
      createFreeSegment('day2a', 'rest-window', '저녁 전 자유시간', 15 * 60, 17 * 60),
    ],
  },
  {
    id: 'day2b',
    label: 'Day 2B',
    meta: '서도쿄 대안',
    variantGroupId: 'day2',
    variantGroupLabel: 'Day 2',
    variantLabel: 'B',
    drawings: [
      createRouteDrawing(
        'day2b',
        'seed-itinerary',
        'Day 2B',
        '서도쿄 대안',
        day2bPlaces,
        createTimelineRange(9 * 60, 21 * 60),
      ),
    ],
    places: day2bPlaces,
    timelineRange: createTimelineRange(9 * 60, 21 * 60),
    segments: [
      createPoiSegment('day2b', 'meiji-stop', day2bPlaces[0], 9 * 60 + 30, 11 * 60),
      createTransitSegment('day2b', 'to-cafe', '하라주쿠 도보 · 10분', 11 * 60, 11 * 60 + 10),
      createPoiSegment('day2b', 'cafe-stop', day2bPlaces[1], 11 * 60 + 10, 11 * 60 + 55),
      createTransitSegment('day2b', 'to-gyoen', 'JR 야마노테선 · 20분', 12 * 60, 12 * 60 + 20),
      createPoiSegment('day2b', 'gyoen-stop', day2bPlaces[2], 12 * 60 + 20, 14 * 60 + 20),
      createFreeSegment('day2b', 'late-break', '저녁 전 자유시간', 14 * 60 + 20, 20 * 60),
      createPoiSegment('day2b', 'hotel-stop', day2bPlaces[3], 20 * 60, 20 * 60 + 30),
    ],
  },
];

const days: DayTab[] = dayLayers.map(({ id, label, meta }) => ({
  id,
  label,
  meta,
}));

const planMeta: PlanMeta = {
  title: '2026 도쿄 3박 4일',
  travelRange: '2026.07.10 ~ 2026.07.13',
};

export function createSeedPlan(): PlannerData {
  return {
    dayLayers,
    days,
    legendItems,
    planMeta,
  };
}
