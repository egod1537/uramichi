export interface TimePosition {
  currentMinutes: number;
  activeSegmentId: string | null;
  activePlaceId: string | null;
}

export interface SimulationPosition {
  activePlaceId: string | null;
  activeSegmentId: string | null;
  kind: 'poi' | 'route';
  position: {
    lat: number;
    lng: number;
  };
  progress: number;
}

export interface SimulationState {
  currentDayId: string;
  currentMinutes: number;
}
