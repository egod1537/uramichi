import React from 'react';
import { getDayLayerGroupMeta } from '../../shared/utils/dayLayerGroups';
import { eventBus } from '../../services/EventBus';
import { planStore } from '../../services/PlanStore';
import type {
  LayerDropPosition,
  SidebarPanelProps,
  SidebarPanelState,
} from './SidebarPanel.types';
import SidebarLayerList from './SidebarLayerList';
import SidebarShareControls from './SidebarShareControls';
import SidebarSummaryCard from './SidebarSummaryCard';

class SidebarPanel extends React.Component<SidebarPanelProps, SidebarPanelState> {
  static defaultProps = {};

  private unsubscribe: (() => void) | null = null;

  constructor(props: SidebarPanelProps) {
    super(props);
    const snapshot = planStore.getSnapshot();

    this.state = {
      draggedLayerId: null,
      draggedPlaceId: null,
      dropPosition: null,
      dropTargetLayerId: null,
      placeDropPosition: null,
      placeDropTargetDayId: null,
      placeDropTargetPlaceId: null,
      snapshot,
      expandedPlaceId: snapshot.activePlaceId,
      openVariantGroupId: null,
    };
  }

  componentDidMount() {
    this.unsubscribe = planStore.subscribe(this.handleStoreChange);
  }

  componentDidUpdate(prevProps: SidebarPanelProps, prevState: SidebarPanelState) {
    if (prevState.snapshot.activePlaceId !== this.state.snapshot.activePlaceId) {
      this.setState({
        expandedPlaceId: this.state.snapshot.activePlaceId,
      });
    }
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  private handleStoreChange = () => {
    this.setState({
      snapshot: planStore.getSnapshot(),
    });
  };

  private handlePlaceClick = (placeId: string) => {
    this.setState((currentState) => ({
      expandedPlaceId: currentState.expandedPlaceId === placeId ? null : placeId,
    }));

    eventBus.emit('pin:select', { pinId: placeId });
  };

  private handleLayerEdit = (dayId: string) => {
    const layer = this.state.snapshot.dayLayers.find((item) => item.id === dayId);

    if (!layer) {
      return;
    }

    const nextLabel = window.prompt('레이어 이름을 수정하세요.', getDayLayerGroupMeta(layer).groupLabel);

    if (nextLabel === null) {
      return;
    }

    const nextMeta = window.prompt('레이어 설명을 수정하세요.', layer.meta);

    if (nextMeta === null) {
      return;
    }

    eventBus.emit('layer:update', {
      dayId,
      changes: {
        label: nextLabel,
        meta: nextMeta,
      },
    });
  };

  private handleLayerDragStart = (dayId: string, event: React.DragEvent<HTMLElement>) => {
    if (this.state.draggedPlaceId) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dayId);

    this.setState({
      draggedLayerId: dayId,
      dropPosition: null,
      dropTargetLayerId: null,
      openVariantGroupId: null,
    });
  };

  private handleLayerDragEnd = () => {
    this.setState({
      draggedLayerId: null,
      dropPosition: null,
      dropTargetLayerId: null,
    });
  };

  private handleLayerDragOver = (dayId: string, event: React.DragEvent<HTMLElement>) => {
    if (this.state.draggedPlaceId) {
      return;
    }

    const { draggedLayerId, dropPosition, dropTargetLayerId } = this.state;

    if (!draggedLayerId || draggedLayerId === dayId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const nextDropPosition = this.getLayerDropPosition(event);

    if (dropTargetLayerId === dayId && dropPosition === nextDropPosition) {
      return;
    }

    this.setState({
      dropPosition: nextDropPosition,
      dropTargetLayerId: dayId,
    });
  };

  private handleLayerDrop = (dayId: string, event: React.DragEvent<HTMLElement>) => {
    if (this.state.draggedPlaceId) {
      return;
    }

    event.preventDefault();

    const sourceDayId = this.state.draggedLayerId || event.dataTransfer.getData('text/plain');
    const dropPosition = this.state.dropPosition ?? this.getLayerDropPosition(event);

    if (!sourceDayId || sourceDayId === dayId) {
      this.handleLayerDragEnd();
      return;
    }

    eventBus.emit('layer:reorder', {
      position: dropPosition,
      sourceDayId,
      targetDayId: dayId,
    });

    this.handleLayerDragEnd();
  };

  private handlePlaceDragStart = (placeId: string, event: React.DragEvent<HTMLElement>) => {
    if (this.state.draggedLayerId) {
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', placeId);

    this.setState({
      draggedPlaceId: placeId,
      openVariantGroupId: null,
      placeDropPosition: null,
      placeDropTargetDayId: null,
      placeDropTargetPlaceId: null,
    });
  };

  private handlePlaceDragEnd = (event?: React.DragEvent<HTMLElement>) => {
    event?.stopPropagation();

    this.setState({
      draggedPlaceId: null,
      placeDropPosition: null,
      placeDropTargetDayId: null,
      placeDropTargetPlaceId: null,
    });
  };

  private handlePlaceDragOver = (
    dayId: string,
    placeId: string,
    event: React.DragEvent<HTMLElement>,
  ) => {
    const { draggedPlaceId, placeDropPosition, placeDropTargetDayId, placeDropTargetPlaceId } =
      this.state;

    if (!draggedPlaceId || draggedPlaceId === placeId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    const nextDropPosition = this.getLayerDropPosition(event);

    if (
      placeDropTargetDayId === dayId &&
      placeDropTargetPlaceId === placeId &&
      placeDropPosition === nextDropPosition
    ) {
      return;
    }

    this.setState({
      placeDropPosition: nextDropPosition,
      placeDropTargetDayId: dayId,
      placeDropTargetPlaceId: placeId,
    });
  };

  private handlePlaceDrop = (
    dayId: string,
    placeId: string,
    event: React.DragEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const sourcePlaceId = this.state.draggedPlaceId || event.dataTransfer.getData('text/plain');
    const dropPosition = this.state.placeDropPosition ?? this.getLayerDropPosition(event);

    if (!sourcePlaceId || sourcePlaceId === placeId) {
      this.handlePlaceDragEnd();
      return;
    }

    eventBus.emit('poi:move', {
      placeId: sourcePlaceId,
      position: dropPosition,
      targetDayId: dayId,
      targetPlaceId: placeId,
    });

    this.handlePlaceDragEnd();
  };

  private handleLayerAppendDragOver = (dayId: string, event: React.DragEvent<HTMLElement>) => {
    const { draggedPlaceId, placeDropTargetDayId, placeDropTargetPlaceId } = this.state;

    if (!draggedPlaceId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    if (placeDropTargetDayId === dayId && placeDropTargetPlaceId === null) {
      return;
    }

    this.setState({
      placeDropPosition: 'after',
      placeDropTargetDayId: dayId,
      placeDropTargetPlaceId: null,
    });
  };

  private handleLayerAppendDrop = (dayId: string, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const sourcePlaceId = this.state.draggedPlaceId || event.dataTransfer.getData('text/plain');

    if (!sourcePlaceId) {
      this.handlePlaceDragEnd();
      return;
    }

    eventBus.emit('poi:move', {
      placeId: sourcePlaceId,
      position: 'after',
      targetDayId: dayId,
      targetPlaceId: null,
    });

    this.handlePlaceDragEnd();
  };

  private handleVariantPickerToggle = (groupId: string) => {
    this.setState((currentState) => ({
      openVariantGroupId: currentState.openVariantGroupId === groupId ? null : groupId,
    }));
  };

  private handleVariantSelect = (dayId: string) => {
    this.setState({
      openVariantGroupId: null,
    });

    eventBus.emit('day:switch', { dayId });
  };

  private getLayerDropPosition(event: React.DragEvent<HTMLElement>): LayerDropPosition {
    const bounds = event.currentTarget.getBoundingClientRect();

    return event.clientY >= bounds.top + bounds.height / 2 ? 'after' : 'before';
  }

  render() {
    const {
      draggedLayerId,
      draggedPlaceId,
      dropPosition,
      dropTargetLayerId,
      expandedPlaceId,
      openVariantGroupId,
      placeDropPosition,
      placeDropTargetDayId,
      placeDropTargetPlaceId,
      snapshot,
    } = this.state;

    return (
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar-header">
          <SidebarSummaryCard snapshot={snapshot} />
          <SidebarShareControls snapshot={snapshot} />
        </div>

        <div className="workspace-sidebar-scroll">
          <SidebarLayerList
            snapshot={snapshot}
            expandedPlaceId={expandedPlaceId}
            draggedLayerId={draggedLayerId}
            draggedPlaceId={draggedPlaceId}
            dropPosition={dropPosition}
            dropTargetLayerId={dropTargetLayerId}
            openVariantGroupId={openVariantGroupId}
            placeDropPosition={placeDropPosition}
            placeDropTargetDayId={placeDropTargetDayId}
            placeDropTargetPlaceId={placeDropTargetPlaceId}
            onLayerDragEnd={this.handleLayerDragEnd}
            onLayerDragOver={this.handleLayerDragOver}
            onLayerDragStart={this.handleLayerDragStart}
            onLayerDrop={this.handleLayerDrop}
            onLayerAppendDragOver={this.handleLayerAppendDragOver}
            onLayerAppendDrop={this.handleLayerAppendDrop}
            onLayerEdit={this.handleLayerEdit}
            onPlaceDragEnd={this.handlePlaceDragEnd}
            onPlaceDragOver={this.handlePlaceDragOver}
            onPlaceDragStart={this.handlePlaceDragStart}
            onPlaceDrop={this.handlePlaceDrop}
            onPlaceClick={this.handlePlaceClick}
            onVariantPickerToggle={this.handleVariantPickerToggle}
            onVariantSelect={this.handleVariantSelect}
          />
        </div>
      </aside>
    );
  }
}

export default SidebarPanel;
