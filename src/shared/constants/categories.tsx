import type { ComponentType } from 'react';
import {
  AccommodationIcon,
  AttractionIcon,
  FoodIcon,
  NightIcon,
  ShoppingIcon,
  TransportIcon,
} from '../../components/icons/WorkspaceIcons';
import type { CategoryId, PoiIconId } from '../../models/Poi';

interface CategoryVisualConfig {
  color: string;
  Icon: ComponentType;
  label: string;
}

const POI_COLOR_OPTIONS = [
  '#d93025',
  '#f29900',
  '#f6bf26',
  '#a142f4',
  '#4285f4',
  '#039be5',
  '#0f9d58',
  '#7cb342',
  '#c0ca33',
  '#f06292',
  '#8d6e63',
  '#5f6368',
  '#ef6c00',
  '#ff8a3d',
  '#ffd54f',
  '#7e57c2',
  '#5c6bc0',
  '#26c6da',
  '#26a69a',
  '#66bb6a',
  '#9ccc65',
  '#bdbdbd',
  '#90a4ae',
  '#b39ddb',
] as const;

const CATEGORY_VISUALS: Record<CategoryId, CategoryVisualConfig> = {
  관광: {
    color: '#ff8a3d',
    Icon: AttractionIcon,
    label: '관광',
  },
  음식: {
    color: '#22a65b',
    Icon: FoodIcon,
    label: '음식',
  },
  쇼핑: {
    color: '#ec4899',
    Icon: ShoppingIcon,
    label: '쇼핑',
  },
  숙소: {
    color: '#9a63f7',
    Icon: AccommodationIcon,
    label: '숙소',
  },
  교통: {
    color: '#2f6fed',
    Icon: TransportIcon,
    label: '교통',
  },
  야간: {
    color: '#4f46e5',
    Icon: NightIcon,
    label: '야간',
  },
};

export const CATEGORY_ICON_IDS = Object.keys(CATEGORY_VISUALS) as CategoryId[];

export function getCategoryVisual(categoryId: CategoryId): CategoryVisualConfig {
  return CATEGORY_VISUALS[categoryId];
}

export function getPoiIconOptions() {
  return CATEGORY_ICON_IDS.map((iconId) => ({
    id: iconId,
    ...getCategoryVisual(iconId),
  }));
}

export function getPoiColorOptions(): readonly string[] {
  return POI_COLOR_OPTIONS;
}

export function renderPoiMarkerGlyph(iconId: PoiIconId, color: string): string {
  const glyphStart = `<g transform="translate(12 10)" fill="${color}">`;
  const glyphEnd = '</g>';

  switch (iconId) {
    case '관광':
      return `
        ${glyphStart}
          <path d="M12 1.55 14.64 6.9l5.9.86-4.27 4.16 1.01 5.88L12 15.02 6.72 17.8l1.01-5.88-4.27-4.16 5.9-.86L12 1.55Z" />
        ${glyphEnd}
      `;
    case '음식':
      return `
        ${glyphStart}
          <path d="M5.3 1.5c-.55 0-1 .45-1 1v2.3c0 1.28.73 2.4 1.8 2.95V18a1 1 0 1 0 2 0V7.75c1.07-.55 1.8-1.67 1.8-2.95V2.5a1 1 0 1 0-2 0v1.7h-.8V2.5a1 1 0 1 0-2 0v1.7h-.8V2.5c0-.55-.45-1-1-1Z" />
          <path d="M15.85 1.5c-1.93 0-3.15 1.8-3.15 4.55 0 2.12.74 3.62 2.15 4.42V18a1 1 0 1 0 2 0V2.5c0-.55-.45-1-1-1Z" />
        ${glyphEnd}
      `;
    case '쇼핑':
      return `
        ${glyphStart}
          <path d="M8.4 4.7A3.6 3.6 0 0 1 12 1.1a3.6 3.6 0 0 1 3.6 3.6V6h1.5c.6 0 1.1.46 1.16 1.06l.92 9.74A1.15 1.15 0 0 1 18.03 18H5.97A1.15 1.15 0 0 1 4.82 16.8l.92-9.74A1.16 1.16 0 0 1 6.9 6h1.5V4.7Zm2 0V6h3.2V4.7A1.6 1.6 0 0 0 12 3.1a1.6 1.6 0 0 0-1.6 1.6Z" />
        ${glyphEnd}
      `;
    case '숙소':
      return `
        ${glyphStart}
          <path d="M11.08 1.67a1.45 1.45 0 0 1 1.84 0l6.1 4.96c.28.23.45.58.45.94V17a1 1 0 0 1-1 1h-4.1a1 1 0 0 1-1-1v-4.25h-2.74V17a1 1 0 0 1-1 1h-4.1a1 1 0 0 1-1-1V7.57c0-.36.17-.7.45-.94l6.1-4.96Z" />
        ${glyphEnd}
      `;
    case '교통':
      return `
        ${glyphStart}
          <path d="M8 1.7A3 3 0 0 0 5 4.7v6.56c0 1.33.87 2.46 2.1 2.84l-1.37 1.82a1 1 0 0 0 1.6 1.2l1.93-2.57h5.48l1.93 2.57a1 1 0 1 0 1.6-1.2l-1.37-1.82A2.99 2.99 0 0 0 19 11.26V4.7a3 3 0 0 0-3-3H8Zm1.1 8.52a1.18 1.18 0 1 1 0 2.36 1.18 1.18 0 0 1 0-2.36Zm5.8 0a1.18 1.18 0 1 1 0 2.36 1.18 1.18 0 0 1 0-2.36Z" />
        ${glyphEnd}
      `;
    case '야간':
      return `
        ${glyphStart}
          <path d="M14.77 1.43a1 1 0 0 0-1.24 1.3 6.52 6.52 0 1 1-8.26 8.26 1 1 0 0 0-1.3 1.24A8.62 8.62 0 1 0 14.77 1.43Z" />
          <path d="M17.35 2.25 17.9 3.7l1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55.55-1.45Z" />
        ${glyphEnd}
      `;
    default:
      return '';
  }
}
