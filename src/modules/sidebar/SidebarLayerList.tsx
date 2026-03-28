import type React from 'react';
import type { PlannerSnapshot } from '../../models/Plan';
import { buildDayLayerGroups } from '../../shared/utils/dayLayerGroups';
import { eventBus } from '../../services/EventBus';
import DayLayerHeader from './DayLayerHeader';
import LayerVariantPanel from './LayerVariantPanel';
import type { LayerDropPosition } from './SidebarPanel.types';
import TimetableItem from './TimetableItem';
import TransitSegment from './TransitSegment';

interface SidebarLayerListProps {
  snapshot: PlannerSnapshot;
  expandedPlaceId: string | null;
  draggedLayerId: string | null;
  draggedPlaceId: string | null;
  dropPosition: LayerDropPosition | null;
  dropTargetLayerId: string | null;
  openVariantGroupId: string | null;
  placeDropPosition: LayerDropPosition | null;
  placeDropTargetDayId: string | null;
  placeDropTargetPlaceId: string | null;
  onLayerAppendDragOver: (dayId: string, event: React.DragEvent<HTMLElement>) => void;
  onLayerAppendDrop: (dayId: string, event: React.DragEvent<HTMLElement>) => void;
  onLayerDragEnd: () => void;
  onLayerDragOver: (dayId: string, event: React.DragEvent<HTMLElement>) => void;
  onLayerDragStart: (dayId: string, event: React.DragEvent<HTMLElement>) => void;
  onLayerDrop: (dayId: string, event: React.DragEvent<HTMLElement>) => void;
  onLayerEdit: (dayId: string) => void;
  onPlaceDragEnd: (event: React.DragEvent<HTMLElement>) => void;
  onPlaceDragOver: (dayId: string, placeId: string, event: React.DragEvent<HTMLElement>) => void;
  onPlaceDragStart: (placeId: string, event: React.DragEvent<HTMLElement>) => void;
  onPlaceDrop: (dayId: string, placeId: string, event: React.DragEvent<HTMLElement>) => void;
  onPlaceClick: (placeId: string) => void;
  onVariantPickerToggle: (groupId: string) => void;
  onVariantSelect: (dayId: string) => void;
}

export default function SidebarLayerList({
  snapshot,
  expandedPlaceId,
  draggedLayerId,
  draggedPlaceId,
  dropPosition,
  dropTargetLayerId,
  openVariantGroupId,
  placeDropPosition,
  placeDropTargetDayId,
  placeDropTargetPlaceId,
  onLayerAppendDragOver,
  onLayerAppendDrop,
  onLayerDragEnd,
  onLayerDragOver,
  onLayerDragStart,
  onLayerDrop,
  onLayerEdit,
  onPlaceDragEnd,
  onPlaceDragOver,
  onPlaceDragStart,
  onPlaceDrop,
  onPlaceClick,
  onVariantPickerToggle,
  onVariantSelect,
}: SidebarLayerListProps) {
  const layerGroups = buildDayLayerGroups(snapshot.dayLayers, snapshot.selectedVariantIds);

  return (
    <div className="workspace-layers-list">
      {layerGroups.map((group) => {
        const layer = group.selectedLayer;
        const isFocused = layer.id === snapshot.currentDayId;
        const isVisible = snapshot.visibleDayIds.includes(layer.id);
        const isCollapsed = snapshot.collapsedDayIds.includes(layer.id);
        const isVariantPickerOpen = openVariantGroupId === group.id;

        return (
          <section
            key={group.id}
            className={`workspace-layer-shell ${
              draggedLayerId === layer.id ? 'workspace-layer-shell--dragging' : ''
            } ${
              dropTargetLayerId === layer.id && dropPosition === 'before'
                ? 'workspace-layer-shell--drop-before'
                : ''
            } ${
              dropTargetLayerId === layer.id && dropPosition === 'after'
                ? 'workspace-layer-shell--drop-after'
                : ''
            } ${
              !isVisible ? 'workspace-layer-shell--hidden' : ''
            } ${
              isVariantPickerOpen ? 'workspace-layer-shell--variant-open' : ''
            }`}
            draggable={true}
            onDragEnd={onLayerDragEnd}
            onDragOver={(event) => onLayerDragOver(layer.id, event)}
            onDragStart={(event) => onLayerDragStart(layer.id, event)}
            onDrop={(event) => onLayerDrop(layer.id, event)}
          >
            <div className={`workspace-layer ${isFocused ? 'workspace-layer--focused' : ''}`}>
              <DayLayerHeader
                layer={layer}
                groupLabel={group.label}
                selectedVariantLabel={group.selectedVariantLabel}
                hasVariants={group.layers.length > 1}
                isVariantPickerOpen={isVariantPickerOpen}
                isFocused={isFocused}
                isVisible={isVisible}
                isCollapsed={isCollapsed}
                onEdit={() => onLayerEdit(layer.id)}
                onFocus={() => eventBus.emit('day:switch', { dayId: layer.id })}
                onToggleVisibility={() =>
                  eventBus.emit('layer:visibility-toggle', { dayId: layer.id })
                }
                onToggleCollapsed={() =>
                  eventBus.emit('layer:collapse-toggle', { dayId: layer.id })
                }
                onToggleVariantPicker={() => onVariantPickerToggle(group.id)}
              />

              {!isCollapsed ? (
                <div className="workspace-layer-body">
                  {(() => {
                    let previousSegmentEnd: number | null = null;

                    return layer.segments.map((segment) => {
                      const hasTimeWarning =
                        segment.end <= segment.start ||
                        (previousSegmentEnd !== null && segment.start < previousSegmentEnd);

                      previousSegmentEnd = segment.end;

                      const isTimelineActive =
                        isFocused &&
                        snapshot.currentMinutes >= segment.start &&
                        snapshot.currentMinutes <= segment.end;

                      if (segment.type === 'poi') {
                        const place = layer.places.find((item) => item.id === segment.placeId);

                        if (!place) {
                          return null;
                        }

                        const isExpanded =
                          expandedPlaceId === place.id || snapshot.activePlaceId === place.id;

                        return (
                          <TimetableItem
                            key={segment.id}
                            hasTimeWarning={hasTimeWarning}
                            place={place}
                            segment={segment}
                            isActive={isTimelineActive || snapshot.activePlaceId === place.id}
                            isDragTargetAfter={
                              draggedPlaceId !== null &&
                              placeDropTargetDayId === layer.id &&
                              placeDropTargetPlaceId === place.id &&
                              placeDropPosition === 'after'
                            }
                            isDragTargetBefore={
                              draggedPlaceId !== null &&
                              placeDropTargetDayId === layer.id &&
                              placeDropTargetPlaceId === place.id &&
                              placeDropPosition === 'before'
                            }
                            isDragging={draggedPlaceId === place.id}
                            isExpanded={isExpanded}
                            onDragEnd={onPlaceDragEnd}
                            onDragOver={(event) => onPlaceDragOver(layer.id, place.id, event)}
                            onDragStart={(event) => onPlaceDragStart(place.id, event)}
                            onDrop={(event) => onPlaceDrop(layer.id, place.id, event)}
                            onClick={() => onPlaceClick(place.id)}
                          />
                        );
                      }

                      return (
                        <TransitSegment
                          key={segment.id}
                          segment={segment}
                          isActive={isTimelineActive}
                        />
                      );
                    });
                  })()}

                  {draggedPlaceId ? (
                    <div
                      className={`workspace-layer-drop-slot ${
                        placeDropTargetDayId === layer.id && placeDropTargetPlaceId === null
                          ? 'workspace-layer-drop-slot--active'
                          : ''
                      }`}
                      onDragOver={(event) => onLayerAppendDragOver(layer.id, event)}
                      onDrop={(event) => onLayerAppendDrop(layer.id, event)}
                    >
                      여기에 놓으면 이 레이어 마지막으로 이동
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {group.layers.length > 1 && isVariantPickerOpen ? (
              <LayerVariantPanel
                groupLabel={group.label}
                layers={group.layers}
                selectedDayId={layer.id}
                onSelect={onVariantSelect}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
