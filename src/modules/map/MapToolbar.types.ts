import type { MapToolId } from '../../models/Plan';

export type MapToolbarActionId = MapToolId;

export type MapToolbarTool =
  | {
      id: MapToolbarActionId;
      label: string;
      disabled?: boolean;
      type?: undefined;
    }
  | {
      id: 'toolbar-divider';
      label: 'divider';
      disabled?: boolean;
      type: 'divider';
    };
