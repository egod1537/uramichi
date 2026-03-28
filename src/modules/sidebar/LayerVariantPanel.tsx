import type { DayLayer } from '../../models/Plan';
import { getDayLayerGroupMeta } from '../../shared/utils/dayLayerGroups';

interface LayerVariantPanelProps {
  groupLabel: string;
  layers: DayLayer[];
  selectedDayId: string;
  onSelect: (dayId: string) => void;
}

export default function LayerVariantPanel({
  groupLabel,
  layers,
  selectedDayId,
  onSelect,
}: LayerVariantPanelProps) {
  return (
    <aside className="workspace-layer-variant-panel" aria-label={`${groupLabel} 대안 선택`}>
      <div className="workspace-layer-variant-panel-header">
        <p className="workspace-layer-variant-panel-eyebrow">대안 프리셋</p>
        <p className="workspace-layer-variant-panel-title">{groupLabel}</p>
      </div>

      <div className="workspace-layer-variant-option-list">
        {layers.map((layer) => {
          const variantLabel = getDayLayerGroupMeta(layer).variantLabel;
          const isSelected = layer.id === selectedDayId;

          return (
            <button
              key={layer.id}
              type="button"
              className={`workspace-layer-variant-option ${
                isSelected ? 'workspace-layer-variant-option--selected' : ''
              }`}
              onClick={() => onSelect(layer.id)}
            >
              <span className="workspace-layer-variant-option-top">
                <span className="workspace-layer-variant-option-badge">
                  {variantLabel ? `${variantLabel}안` : layer.label}
                </span>
                {isSelected ? (
                  <span className="workspace-layer-variant-option-state">현재 선택</span>
                ) : null}
              </span>
              <span className="workspace-layer-variant-option-meta">{layer.meta}</span>
              <span className="workspace-layer-variant-option-submeta">
                장소 {layer.places.length}개
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
