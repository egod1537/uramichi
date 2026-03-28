import type { PlanMeta } from '../../models/Plan';
import type { MapToolbarActionId } from './MapToolbar.types';
import { mapToolbarTools } from './mapConfig';
import MapCornerControls from './MapCornerControls';
import MapSearchBar from './MapSearchBar';
import MapToolbar from './MapToolbar';
import type { MapSearchSuggestion } from './MapView.types';

interface MapControlsOverlayProps {
  activeToolId: MapToolbarActionId;
  isSearchOpen: boolean;
  onToolSelect: (toolId: MapToolbarActionId) => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchSelect: (suggestion: MapSearchSuggestion) => void;
  onSearchSubmit: () => void;
  planMeta: PlanMeta;
  searchQuery: string;
  searchSuggestions: MapSearchSuggestion[];
}

export default function MapControlsOverlay({
  activeToolId,
  isSearchOpen,
  onToolSelect,
  onSearchChange,
  onSearchFocus,
  onSearchSelect,
  onSearchSubmit,
  planMeta,
  searchQuery,
  searchSuggestions,
}: MapControlsOverlayProps) {
  return (
    <>
      <div className="workspace-map-controls">
        <MapSearchBar
          isOpen={isSearchOpen}
          onChange={onSearchChange}
          onFocus={onSearchFocus}
          onSelectSuggestion={onSearchSelect}
          onSubmit={onSearchSubmit}
          suggestions={searchSuggestions}
          value={searchQuery}
        />
        <MapToolbar tools={mapToolbarTools} activeToolId={activeToolId} onToolSelect={onToolSelect} />
      </div>
      <MapCornerControls planTitle={planMeta.title} travelRange={planMeta.travelRange} />
    </>
  );
}
