import type { DayLayer } from '../../models/Plan';
import { ChevronDownIcon } from '../../components/icons/WorkspaceIcons';

interface DayLayerHeaderProps {
  layer: DayLayer;
  groupLabel: string;
  selectedVariantLabel: string | null;
  hasVariants: boolean;
  isVariantPickerOpen: boolean;
  isFocused: boolean;
  isVisible: boolean;
  isCollapsed: boolean;
  onEdit: () => void;
  onFocus: () => void;
  onToggleVisibility: () => void;
  onToggleCollapsed: () => void;
  onToggleVariantPicker: () => void;
}

export default function DayLayerHeader({
  layer,
  groupLabel,
  selectedVariantLabel,
  hasVariants,
  isVariantPickerOpen,
  isFocused,
  isVisible,
  isCollapsed,
  onEdit,
  onFocus,
  onToggleVisibility,
  onToggleCollapsed,
  onToggleVariantPicker,
}: DayLayerHeaderProps) {
  return (
    <>
      <div className="workspace-layer-header">
        <label className="workspace-layer-checkbox">
          <input type="checkbox" checked={isVisible} onChange={onToggleVisibility} />
          <span className="workspace-layer-checkbox-ui" />
        </label>

        <button type="button" className="workspace-layer-focus" onClick={onFocus}>
          <span className="workspace-layer-title-row">
            <span className="workspace-layer-title">{groupLabel}</span>
            {selectedVariantLabel ? (
              <span className="workspace-layer-variant-badge">{selectedVariantLabel}안</span>
            ) : null}
            {isFocused ? <span className="workspace-layer-focus-badge">선택됨</span> : null}
          </span>
          <span className="workspace-layer-meta">{layer.meta}</span>
        </button>

        <button
          type="button"
          className={`workspace-layer-collapse ${
            isCollapsed ? 'workspace-layer-collapse--collapsed' : ''
          }`}
          onClick={onToggleCollapsed}
          aria-label={`${layer.label} ${isCollapsed ? '펼치기' : '접기'}`}
        >
          <ChevronDownIcon />
        </button>
      </div>

      <div className="workspace-layer-style-row">
        <button type="button" className="workspace-layer-option-button" onClick={onEdit}>
          레이어 편집
        </button>
        {hasVariants ? (
          <button
            type="button"
            className={`workspace-layer-option-button ${
              isVariantPickerOpen ? 'workspace-layer-option-button--active' : ''
            }`}
            onClick={onToggleVariantPicker}
            aria-expanded={isVariantPickerOpen}
          >
            대안 프리셋
          </button>
        ) : null}
        <span className="workspace-layer-style-meta">
          {hasVariants && selectedVariantLabel ? `현재 ${selectedVariantLabel}안 · ` : ''}
          {layer.places.length}개 장소
        </span>
      </div>
    </>
  );
}
