import type { MapToolId } from '../../models/Plan';
import {
  HandToolIcon,
  LineToolIcon,
  MapPinIcon,
  MeasureToolIcon,
  TransportIcon,
} from '../../components/icons/WorkspaceIcons';
import IconButton from '../../shared/components/IconButton';
import { mapToolShortcutLabels } from './mapConfig';
import type { MapToolbarActionId, MapToolbarTool } from './MapToolbar.types';

interface MapToolbarProps {
  tools: MapToolbarTool[];
  activeToolId: MapToolId;
  onToolSelect: (toolId: MapToolbarActionId) => void;
}

const toolIcons = {
  hand: HandToolIcon,
  pin: MapPinIcon,
  transit: TransportIcon,
  line: LineToolIcon,
  measure: MeasureToolIcon,
};

export default function MapToolbar({ tools, activeToolId, onToolSelect }: MapToolbarProps) {
  return (
    <div className="workspace-map-toolbar" role="toolbar" aria-label="지도 툴바">
      {tools.map((tool) => {
        if (tool.type === 'divider') {
          return (
            <span
              key={tool.id}
              className="workspace-map-toolbar-divider"
              aria-hidden="true"
            />
          );
        }

        const Icon = toolIcons[tool.id as keyof typeof toolIcons];
        const shortcutLabel =
          tool.type === 'divider'
            ? ''
            : mapToolShortcutLabels[tool.id as keyof typeof mapToolShortcutLabels];
        const title = shortcutLabel ? `${tool.label} (${shortcutLabel})` : tool.label;

        return (
          <IconButton
            key={tool.id}
            ariaLabel={title}
            className={`workspace-map-tool-button ${
              activeToolId === tool.id ? 'workspace-map-tool-button--active' : ''
            } ${
              tool.disabled ? 'workspace-map-tool-button--disabled' : ''
            } workspace-map-tool-button--${tool.id}`}
            disabled={tool.disabled}
            title={title}
            onClick={() => onToolSelect(tool.id as MapToolbarActionId)}
          >
            <span className="workspace-map-tool-icon">{Icon ? <Icon /> : null}</span>
          </IconButton>
        );
      })}
    </div>
  );
}
