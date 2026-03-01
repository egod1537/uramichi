import React from 'react';
import LayerRow from './LayerRow';
import useProjectStore from '../../stores/useProjectStore';
import withStore from '../../utils/withStore';
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/opts';
import { convertTimeStringToMinutes, normalizeOpeningHours } from '../../utils/time';

const TIME_SLIDER_MINUTES_STEP = 30;
const TIME_SLIDER_MINUTES_MAX = 24 * 60;
const FILTER_TIME_DEFAULT_RANGE = { start: '09:00', end: '18:00' };

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
      isFilterPopupOpen: false,
      isTimeFilterEnabled: false,
      filterTimeRange: FILTER_TIME_DEFAULT_RANGE,
      activeTimeSliderHandle: 'end',
    };
    this.filterPopupRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleF2Keydown);
    window.addEventListener('mousedown', this.handleOutsideClick);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleF2Keydown);
    window.removeEventListener('mousedown', this.handleOutsideClick);
  }

  getNormalizedSliderMinutes = (minutesValue, fallbackMinutes) => {
    if (typeof minutesValue !== 'number' || Number.isNaN(minutesValue)) return fallbackMinutes;
    const boundedMinutes = Math.max(0, Math.min(TIME_SLIDER_MINUTES_MAX, minutesValue));
    return Math.round(boundedMinutes / TIME_SLIDER_MINUTES_STEP) * TIME_SLIDER_MINUTES_STEP;
  };

  convertMinutesToTimeText = (minutesValue) => {
    const boundedMinutes = Math.max(0, Math.min(TIME_SLIDER_MINUTES_MAX, minutesValue));
    if (boundedMinutes === TIME_SLIDER_MINUTES_MAX) return '24:00';
    const hourValue = Math.floor(boundedMinutes / 60);
    const minuteValue = boundedMinutes % 60;
    return `${String(hourValue).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')}`;
  };

  doesPinMatchTimeFilter = (pinItem, filterStartMinutes, filterEndMinutes) => {
    const openingHoursRangeList = normalizeOpeningHours(pinItem.openingHours);
    if (!openingHoursRangeList.length) return false;
    return openingHoursRangeList.some((openingHoursRangeItem) => {
      const isTimeRangeOverlapped =
        openingHoursRangeItem.startMinutes < filterEndMinutes &&
        openingHoursRangeItem.endMinutes > filterStartMinutes;
      return isTimeRangeOverlapped;
    });
  };

  handleOutsideClick = (event) => {
    if (!this.state.isFilterPopupOpen) return;
    if (this.filterPopupRef.current?.contains(event.target)) return;
    this.setState({ isFilterPopupOpen: false });
  };

  handleStartSliderChange = (nextStartMinutesText) => {
    this.setState((previousState) => {
      const startMinutes = this.getNormalizedSliderMinutes(
        convertTimeStringToMinutes(previousState.filterTimeRange.start),
        9 * 60,
      );
      const endMinutes = this.getNormalizedSliderMinutes(
        convertTimeStringToMinutes(previousState.filterTimeRange.end),
        18 * 60,
      );
      const sliderEndMinutes = Math.max(startMinutes, endMinutes);
      const nextStartMinutes = this.getNormalizedSliderMinutes(
        Number(nextStartMinutesText),
        startMinutes,
      );
      const resolvedStartMinutes = Math.min(nextStartMinutes, sliderEndMinutes);

      return {
        filterTimeRange: {
          ...previousState.filterTimeRange,
          start: this.convertMinutesToTimeText(resolvedStartMinutes),
        },
      };
    });
  };

  handleEndSliderChange = (nextEndMinutesText) => {
    this.setState((previousState) => {
      const startMinutes = this.getNormalizedSliderMinutes(
        convertTimeStringToMinutes(previousState.filterTimeRange.start),
        9 * 60,
      );
      const endMinutes = this.getNormalizedSliderMinutes(
        convertTimeStringToMinutes(previousState.filterTimeRange.end),
        18 * 60,
      );
      const sliderStartMinutes = Math.min(startMinutes, endMinutes);
      const nextEndMinutes = this.getNormalizedSliderMinutes(
        Number(nextEndMinutesText),
        endMinutes,
      );
      const resolvedEndMinutes = Math.max(nextEndMinutes, sliderStartMinutes);

      return {
        filterTimeRange: {
          ...previousState.filterTimeRange,
          end: this.convertMinutesToTimeText(resolvedEndMinutes),
        },
      };
    });
  };

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

    const {
      dragLayerId,
      layerDropPreview,
      focusedRenameTarget,
      editingRenameTarget,
      isFilterPopupOpen,
      isTimeFilterEnabled,
      filterTimeRange,
      activeTimeSliderHandle,
    } = this.state;

    const activeIconSet = new Set(
      ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map(
        (filterItem) => filterItem.key,
      ),
    );

    const startMinutes = this.getNormalizedSliderMinutes(
      convertTimeStringToMinutes(filterTimeRange.start),
      9 * 60,
    );
    const endMinutes = this.getNormalizedSliderMinutes(
      convertTimeStringToMinutes(filterTimeRange.end),
      18 * 60,
    );
    const sliderStartMinutes = Math.min(startMinutes, endMinutes);
    const sliderEndMinutes = Math.max(startMinutes, endMinutes);
    const sliderRangeWidthPercent =
      ((sliderEndMinutes - sliderStartMinutes) / TIME_SLIDER_MINUTES_MAX) * 100;
    const sliderRangeLeftPercent = (sliderStartMinutes / TIME_SLIDER_MINUTES_MAX) * 100;

    const filteredPins = pins.filter((pinItem) => {
      const isIconMatched =
        !pinIconFilters.length || activeIconSet.has(getTravelPinIconKey(pinItem.icon));
      if (!isIconMatched) return false;
      if (!isTimeFilterEnabled) return true;
      return this.doesPinMatchTimeFilter(pinItem, sliderStartMinutes, sliderEndMinutes);
    });

    const activeFilterSummaryList = [];
    if (pinIconFilters.length) activeFilterSummaryList.push(`아이콘 ${pinIconFilters.length}개`);
    if (isTimeFilterEnabled)
      activeFilterSummaryList.push(`시간 ${filterTimeRange.start}~${filterTimeRange.end}`);

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
        <div
          className="relative mb-2 rounded-md border border-gray-200 bg-white p-2"
          ref={this.filterPopupRef}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                this.setState((previousState) => ({
                  isFilterPopupOpen: !previousState.isFilterPopupOpen,
                }))
              }
              className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              필터
            </button>
            <p className="truncate text-xs text-gray-500">
              {activeFilterSummaryList.length
                ? activeFilterSummaryList.join(' · ')
                : '적용된 필터 없음'}
            </p>
          </div>

          {isFilterPopupOpen && (
            <div className="absolute right-0 top-10 z-20 w-[300px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">레이어 필터</p>
                <button
                  type="button"
                  onClick={() => {
                    clearPinIconFilter();
                    this.setState({
                      isTimeFilterEnabled: false,
                      filterTimeRange: FILTER_TIME_DEFAULT_RANGE,
                    });
                  }}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-gray-500">핀 아이콘</p>
                <div className="flex flex-wrap items-center gap-1">
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
                        <img src={filterItem.svgPath} alt={filterItem.label} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={isTimeFilterEnabled}
                    onChange={(event) =>
                      this.setState({ isTimeFilterEnabled: event.target.checked })
                    }
                  />
                  시간 필터 적용
                </label>

                {isTimeFilterEnabled && (
                  <div className="rounded-md border border-gray-100 bg-gray-50 px-2 py-2">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{filterTimeRange.start}</span>
                      <span>{filterTimeRange.end}</span>
                    </div>
                    <div className="relative h-6">
                      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-gray-200" />
                      <div
                        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-orange-300"
                        style={{
                          left: `${sliderRangeLeftPercent}%`,
                          width: `${sliderRangeWidthPercent}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={TIME_SLIDER_MINUTES_MAX}
                        step={TIME_SLIDER_MINUTES_STEP}
                        value={sliderStartMinutes}
                        onChange={(event) => this.handleStartSliderChange(event.target.value)}
                        onMouseDown={() => this.setState({ activeTimeSliderHandle: 'start' })}
                        onTouchStart={() => this.setState({ activeTimeSliderHandle: 'start' })}
                        className={`map-time-range-slider absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent ${
                          activeTimeSliderHandle === 'start' ? 'z-40' : 'z-20'
                        }`}
                      />
                      <input
                        type="range"
                        min={0}
                        max={TIME_SLIDER_MINUTES_MAX}
                        step={TIME_SLIDER_MINUTES_STEP}
                        value={sliderEndMinutes}
                        onChange={(event) => this.handleEndSliderChange(event.target.value)}
                        onMouseDown={() => this.setState({ activeTimeSliderHandle: 'end' })}
                        onTouchStart={() => this.setState({ activeTimeSliderHandle: 'end' })}
                        className={`map-time-range-slider absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent ${
                          activeTimeSliderHandle === 'end' ? 'z-40' : 'z-30'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

const LayerPanelContainer = withStore(LayerPanel, { projectStore: useProjectStore });

export default LayerPanelContainer;
