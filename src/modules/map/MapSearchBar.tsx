import { MapPinIcon, SearchIcon } from '../../components/icons/WorkspaceIcons';
import type { MapSearchSuggestion } from './MapView.types';

interface MapSearchBarProps {
  isOpen: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSelectSuggestion: (suggestion: MapSearchSuggestion) => void;
  onSubmit: () => void;
  placeholder?: string;
  suggestions: MapSearchSuggestion[];
  value: string;
}

export default function MapSearchBar({
  isOpen,
  onChange,
  onFocus,
  onSelectSuggestion,
  onSubmit,
  placeholder = '장소, 역, 지역, POI 검색',
  suggestions,
  value,
}: MapSearchBarProps) {
  return (
    <div className="workspace-map-search-shell">
      <form
        className={`workspace-map-search ${isOpen ? 'workspace-map-search--open' : ''}`}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="search"
          className="workspace-map-search-input"
          placeholder={placeholder}
          aria-label="지도 검색"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
        />
        <button type="submit" className="workspace-map-search-button" aria-label="검색">
          <SearchIcon />
        </button>
      </form>

      {isOpen && suggestions.length ? (
        <div className="workspace-map-search-dropdown" role="listbox" aria-label="검색 제안">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className={`workspace-map-search-suggestion ${
                suggestion.kind === 'nearby-action'
                  ? 'workspace-map-search-suggestion--action'
                  : ''
              }`}
              onClick={() => onSelectSuggestion(suggestion)}
            >
              <span className="workspace-map-search-suggestion-icon" aria-hidden="true">
                {suggestion.kind === 'nearby-action' ? <SearchIcon /> : <MapPinIcon />}
              </span>
              <span className="workspace-map-search-suggestion-copy">
                <span className="workspace-map-search-suggestion-main">
                  {suggestion.mainText}
                </span>
                <span className="workspace-map-search-suggestion-secondary">
                  {suggestion.secondaryText}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
