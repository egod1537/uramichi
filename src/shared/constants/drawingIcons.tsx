import type { ComponentType } from 'react';
import {
  BusRouteIcon,
  FerryRouteIcon,
  PlaneRouteIcon,
  SubwayRouteIcon,
  TaxiRouteIcon,
  TrainRouteIcon,
  TramRouteIcon,
  WalkRouteIcon,
} from '../../components/icons/WorkspaceIcons';
import type { MapDrawingIconId } from '../../models/Route';

interface DrawingIconVisualConfig {
  color: string;
  Icon: ComponentType;
  label: string;
}

const DRAWING_ICON_VISUALS: Record<MapDrawingIconId, DrawingIconVisualConfig> = {
  walk: {
    color: '#6b7280',
    Icon: WalkRouteIcon,
    label: '도보',
  },
  bus: {
    color: '#f97316',
    Icon: BusRouteIcon,
    label: '버스',
  },
  subway: {
    color: '#2563eb',
    Icon: SubwayRouteIcon,
    label: '지하철',
  },
  train: {
    color: '#16a34a',
    Icon: TrainRouteIcon,
    label: '철도',
  },
  tram: {
    color: '#9333ea',
    Icon: TramRouteIcon,
    label: '트램',
  },
  ferry: {
    color: '#0891b2',
    Icon: FerryRouteIcon,
    label: '페리',
  },
  taxi: {
    color: '#f59e0b',
    Icon: TaxiRouteIcon,
    label: '택시',
  },
  plane: {
    color: '#0ea5e9',
    Icon: PlaneRouteIcon,
    label: '항공',
  },
};

export const DRAWING_ICON_IDS = Object.keys(DRAWING_ICON_VISUALS) as MapDrawingIconId[];

export function getDrawingIconVisual(iconId: MapDrawingIconId): DrawingIconVisualConfig {
  return DRAWING_ICON_VISUALS[iconId];
}

export function getDrawingIconOptions() {
  return DRAWING_ICON_IDS.map((iconId) => ({
    id: iconId,
    ...getDrawingIconVisual(iconId),
  }));
}
