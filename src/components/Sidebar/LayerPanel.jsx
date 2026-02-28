import React from 'react';
import LayerRow from './LayerRow';
import useProjectStore from '../../stores/useProjectStore';
import withStore from '../../utils/withStore';
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/opts';

const findPinNameByPosition = (pinList, targetPosition) => {
  if (!targetPosition) return 'Unknown';
  const matchedPin = pinList.find(
    (pinItem) =>
      Math.abs(pinItem.position.lat - targetPosition.lat) < 0.000001 &&
      Math.abs(pinItem.position.lng - targetPosition.lng) < 0.000001,
  );
  return matchedPin?.name || `${targetPosition.lat.toFixed(3)}, ${targetPosition.lng.toFixed(3)}`;
};

class LayerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragLayerId: null,
      layerDropPreview: null,
      focusedRenameTarget: null,
      editingRenameTarget: null,
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleF2Keydown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleF2Keydown);
  }

  handleF2Keydown = (event) => {
    const { focusedRenameTarget } = this.state;
    if (event.key !== 'F2') return;
    if (!focusedRenameTarget?.id) return;
    event.preventDefault();
    this.setState({ editingRenameTarget: focusedRenameTarget });
  };

  render() {
    const { projectStore } = this.props;
    const {
      layers,
      pins,
      routes,
      lines,
      reorderLayers,
      pinIconFilters,
      togglePinIconFilter,
      clearPinIconFilter,
    } = projectStore;

    const { dragLayerId, layerDropPreview, focusedRenameTarget, editingRenameTarget } = this.state;
    const filteredPins = !pinIconFilters.length
      ? pins
      : pins.filter((pinItem) => {
          const activeIconSet = new Set(
            ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map(
              (filterItem) => filterItem.key,
            ),
          );
          return activeIconSet.has(getTravelPinIconKey(pinItem.icon));
        });

    const routeSummaryList = routes.map((routeItem) => ({
      id: routeItem.id,
      label: `${findPinNameByPosition(pins, routeItem.start)} → ${findPinNameByPosition(pins, routeItem.end)}`,
    }));

    if (!layers.length) {
      return (
        <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mb-2 rounded-md border border-gray-200 bg-white p-2">
          <div className="flex items-center gap-1">
            {ICON_FILTER_OPTIONS.map((filterItem) => {
              const isActive = pinIconFilters.includes(filterItem.key);
              return (
                <button
                  key={filterItem.key}
                  type="button"
                  onClick={() => togglePinIconFilter(filterItem.key)}
                  title={filterItem.label}
                  aria-label={filterItem.label}
                  className={`rounded-full border p-1 ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                >
                  <img src={filterItem.svgPath} alt={filterItem.label} className="h-5 w-5" />
                </button>
              );
            })}
            <button
              type="button"
              onClick={clearPinIconFilter}
              className="ml-auto rounded-full border border-gray-200 bg-white p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
              disabled={!pinIconFilters.length}
              title="필터 초기화"
              aria-label="필터 초기화"
            >
              <img src="/svg/filter-reset.svg" alt="필터 초기화" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!!routeSummaryList.length && (
          <div className="mb-2 rounded-md border border-gray-200 bg-white p-2">
            <p className="mb-1 text-xs font-semibold text-gray-500">경로</p>
            <ul className="space-y-1">
              {routeSummaryList.map((routeSummaryItem) => (
                <li key={routeSummaryItem.id} className="truncate text-sm text-gray-700">
                  {routeSummaryItem.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {layers.map((layerItem) => (
          <LayerRow
            key={layerItem.id}
            layer={layerItem}
            filteredPins={filteredPins}
            lines={lines}
            isDraggingLayer={dragLayerId === layerItem.id}
            layerDropPreview={layerDropPreview}
            onLayerDragStart={(layerId) => this.setState({ dragLayerId: layerId })}
            onLayerDragEnd={() => {
              this.setState({ dragLayerId: null, layerDropPreview: null });
            }}
            onLayerDragOver={(nextTargetLayerId, dropPosition) => {
              if (!dragLayerId || dragLayerId === nextTargetLayerId) {
                this.setState({ layerDropPreview: null });
                return;
              }
              this.setState({
                layerDropPreview: { targetLayerId: nextTargetLayerId, dropPosition },
              });
            }}
            onLayerDrop={(nextTargetLayerId, dropPosition) => {
              if (!dragLayerId) return;
              reorderLayers(dragLayerId, nextTargetLayerId, dropPosition);
              this.setState({ dragLayerId: null, layerDropPreview: null });
            }}
            focusedRenameTarget={focusedRenameTarget}
            editingRenameTarget={editingRenameTarget}
            onFocusRenameTarget={(nextTarget) => this.setState({ focusedRenameTarget: nextTarget })}
            onStartRename={(renameTarget) => {
              this.setState({
                focusedRenameTarget: renameTarget,
                editingRenameTarget: renameTarget,
              });
            }}
            onFinishRename={() => this.setState({ editingRenameTarget: null })}
          />
        ))}
        <div
          className={`h-1 rounded bg-blue-500 transition-opacity ${layerDropPreview?.targetLayerId === '__end__' ? 'opacity-100' : 'opacity-0'}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!dragLayerId) return;
            this.setState({ layerDropPreview: { targetLayerId: '__end__', dropPosition: 'end' } });
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!dragLayerId || !layers.length) return;
            reorderLayers(dragLayerId, layers[layers.length - 1].id, 'end');
            this.setState({ dragLayerId: null, layerDropPreview: null });
          }}
        />
      </div>
    );
  }
}

export default withStore(LayerPanel, { projectStore: useProjectStore });
