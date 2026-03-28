export type SegmentType = 'poi' | 'travel' | 'free';
export type MapDrawingType = 'polyline' | 'polygon';
export type MapDrawingRole = 'annotation' | 'itinerary';
export type MapDrawingIconId =
  | 'walk'
  | 'bus'
  | 'subway'
  | 'train'
  | 'tram'
  | 'ferry'
  | 'taxi'
  | 'plane';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface MapDrawing {
  detail: string;
  estimatedCost: string;
  fillColor?: string;
  id: string;
  iconId: MapDrawingIconId;
  label: string;
  memo: string;
  path: RoutePoint[];
  role?: MapDrawingRole;
  strokeColor: string;
  timeText: string;
  type: MapDrawingType;
}

export type MapDrawingEditableFields = Partial<
  Pick<MapDrawing, 'label' | 'detail' | 'timeText' | 'estimatedCost' | 'memo'>
>;

export interface TimelineRange {
  start: number;
  end: number;
}

export interface BaseSegment {
  id: string;
  type: SegmentType;
  label: string;
  start: number;
  end: number;
  color: string;
}

export interface PoiSegment extends BaseSegment {
  type: 'poi';
  placeId: string;
}

export interface TravelSegment extends BaseSegment {
  type: 'travel';
}

export interface FreeSegment extends BaseSegment {
  type: 'free';
}

export type DaySegment = PoiSegment | TravelSegment | FreeSegment;
