import type { MapToolId } from '../../models/Plan';
import type { MapToolbarTool } from './MapToolbar.types';

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

export const hasConfiguredGoogleMapsApiKey = Boolean(
  googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY',
);

export const mapToolbarTools: MapToolbarTool[] = [
  { id: 'hand', label: '손 도구' },
  { id: 'toolbar-divider', label: 'divider', type: 'divider' },
  { id: 'pin', label: '핀 찍기' },
  { id: 'transit', label: '대중교통 경로' },
  { id: 'line', label: '선 그리기' },
  { id: 'measure', label: '거리 재기' },
];

export const mapToolShortcutLabels: Record<MapToolId, string> = {
  hand: 'Q',
  pin: 'W',
  transit: 'E',
  line: 'R',
  measure: 'T',
};
