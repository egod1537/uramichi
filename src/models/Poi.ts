export type CategoryId = '관광' | '음식' | '쇼핑' | '숙소' | '교통' | '야간';
export type PoiIconId = CategoryId;

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface Poi {
  id: string;
  dayId: string;
  name: string;
  tag: CategoryId;
  iconId: PoiIconId;
  color: string;
  position: MapPosition;
  zoom?: number;
  summary: string;
  detail: string;
  visitTime: string;
  businessHours: string;
  estimatedCost: string;
  memo: string;
}

export type PoiEditableFields = Partial<
  Pick<Poi, 'name' | 'summary' | 'detail' | 'visitTime' | 'businessHours' | 'estimatedCost' | 'memo'>
>;

export interface LegendItem {
  id: CategoryId;
  label: string;
  color: string;
}
