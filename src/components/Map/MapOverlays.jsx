import { useState } from 'react'
import TOOL_MODES from '../../utils/toolModes'
import { ICON_FILTER_OPTIONS } from '../../utils/opts'
import { convertTimeStringToMinutes } from '../../utils/time'
import RouteSummaryPopup from './RouteSummaryPopup'

const routeTravelModeList = [
  { value: 'WALKING', label: '도보' },
  { value: 'TRANSIT', label: '대중교통' },
  { value: 'DRIVING', label: '차량' },
]

const TIME_SLIDER_MINUTES_STEP = 30
const TIME_SLIDER_MINUTES_MAX = 24 * 60

const normalizeSliderMinutes = (minutesValue, fallbackMinutes) => {
  if (typeof minutesValue !== 'number' || Number.isNaN(minutesValue)) return fallbackMinutes
  const boundedMinutes = Math.max(0, Math.min(TIME_SLIDER_MINUTES_MAX, minutesValue))
  return Math.round(boundedMinutes / TIME_SLIDER_MINUTES_STEP) * TIME_SLIDER_MINUTES_STEP
}

const convertMinutesToTimeText = (minutesValue) => {
  const boundedMinutes = Math.max(0, Math.min(TIME_SLIDER_MINUTES_MAX, minutesValue))
  if (boundedMinutes === TIME_SLIDER_MINUTES_MAX) return '24:00'
  const hourValue = Math.floor(boundedMinutes / 60)
  const minuteValue = boundedMinutes % 60
  return `${String(hourValue).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')}`
}

function MapOverlays({
  currentMode,
  isTimeFilterExpanded,
  isPinFilterExpanded,
  pinIconFilters,
  routeDraft,
  recentRouteInfo,
  timeFilterRange,
  onSetTimeFilterExpanded,
  onSetTimeFilterRange,
  onClearPinIconFilter,
  onTogglePinIconFilter,
  onSetPinFilterExpanded,
  onSetRouteTravelMode,
  onCloseRouteSummary,
}) {
  const [activeTimeSliderHandle, setActiveTimeSliderHandle] = useState('end')
  const activePinFilterItems = ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key))
  const collapsedPreviewFilterItems = activePinFilterItems.slice(0, 2)
  const hiddenPreviewFilterCount = Math.max(activePinFilterItems.length - collapsedPreviewFilterItems.length, 0)
  const startMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(timeFilterRange.start), 9 * 60)
  const endMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(timeFilterRange.end), 18 * 60)
  const sliderStartMinutes = Math.min(startMinutes, endMinutes)
  const sliderEndMinutes = Math.max(startMinutes, endMinutes)
  const sliderRangeWidthPercent = ((sliderEndMinutes - sliderStartMinutes) / TIME_SLIDER_MINUTES_MAX) * 100
  const sliderRangeLeftPercent = (sliderStartMinutes / TIME_SLIDER_MINUTES_MAX) * 100

  const handleStartSliderChange = (nextStartMinutesText) => {
    const nextStartMinutes = normalizeSliderMinutes(Number(nextStartMinutesText), sliderStartMinutes)
    const resolvedStartMinutes = Math.min(nextStartMinutes, sliderEndMinutes)
    onSetTimeFilterRange('start', convertMinutesToTimeText(resolvedStartMinutes))
  }

  const handleEndSliderChange = (nextEndMinutesText) => {
    const nextEndMinutes = normalizeSliderMinutes(Number(nextEndMinutesText), sliderEndMinutes)
    const resolvedEndMinutes = Math.max(nextEndMinutes, sliderStartMinutes)
    onSetTimeFilterRange('end', convertMinutesToTimeText(resolvedEndMinutes))
  }

  return (
    <>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-end gap-2">
        <div
          className={`rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg transition-all duration-200 ${
            isTimeFilterExpanded ? 'inline-flex max-w-[58vw] items-center gap-3' : 'inline-flex w-auto items-center gap-2'
          }`}
        >
          <img src="/svg/map-time-filter.svg" alt="지도 시간 필터" className="h-5 w-auto shrink-0" />

        {isTimeFilterExpanded ? (
          <>
            <div className="flex w-[300px] flex-col gap-2 text-xs text-gray-700">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>{timeFilterRange.start}</span>
                <span>{timeFilterRange.end}</span>
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
                  onChange={(event) => handleStartSliderChange(event.target.value)}
                  onMouseDown={() => setActiveTimeSliderHandle('start')}
                  onTouchStart={() => setActiveTimeSliderHandle('start')}
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
                  onChange={(event) => handleEndSliderChange(event.target.value)}
                  onMouseDown={() => setActiveTimeSliderHandle('end')}
                  onTouchStart={() => setActiveTimeSliderHandle('end')}
                  className={`map-time-range-slider absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent ${
                    activeTimeSliderHandle === 'end' ? 'z-40' : 'z-30'
                  }`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSetTimeFilterExpanded(false)}
              className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
              aria-label="시간 필터 접기"
              title="시간 필터 접기"
            >
              −
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onSetTimeFilterExpanded(true)}
            className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
            aria-label="시간 필터 펼치기"
            title="시간 필터 펼치기"
          >
            +
          </button>
        )}
        </div>

        <div
          className={`rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg transition-all duration-200 ${
            isPinFilterExpanded ? 'inline-flex max-w-[58vw] items-center gap-3' : 'inline-flex w-auto items-center gap-2'
          }`}
        >
          <img src="/svg/map-pin-filter.svg" alt="지도 핀 아이콘 필터" className="h-5 w-auto shrink-0" />

        {isPinFilterExpanded ? (
          <>
            <button
              type="button"
              onClick={onClearPinIconFilter}
              disabled={!pinIconFilters.length}
              className="shrink-0 rounded-full border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
              aria-label="핀 아이콘 필터 초기화"
              title="핀 아이콘 필터 초기화"
            >
              <img src="/svg/filter-reset-alt.svg" alt="" className="h-4 w-4" />
            </button>
            <div className="flex max-w-[56vw] items-center gap-1 overflow-x-auto">
              {ICON_FILTER_OPTIONS.map((filterItem) => {
                const isActive = pinIconFilters.includes(filterItem.key)
                return (
                  <button
                    key={`map-filter-${filterItem.key}`}
                    type="button"
                    onClick={() => onTogglePinIconFilter(filterItem.key)}
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    <img src={filterItem.svgPath} alt={filterItem.label} className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => onSetPinFilterExpanded(false)}
              className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
              aria-label="핀 아이콘 필터 접기"
              title="핀 아이콘 필터 접기"
            >
              −
            </button>
          </>
        ) : (
          <>
            {activePinFilterItems.length > 0 && (
              <div className="flex items-center gap-1">
                {collapsedPreviewFilterItems.map((filterItem) => (
                  <span
                    key={`map-filter-collapsed-${filterItem.key}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50"
                    title={filterItem.label}
                  >
                    <img src={filterItem.svgPath} alt={filterItem.label} className="h-3.5 w-3.5" />
                  </span>
                ))}
                {hiddenPreviewFilterCount > 0 && <span className="text-xs font-medium text-blue-700">+{hiddenPreviewFilterCount}</span>}
              </div>
            )}
            <button
              type="button"
              onClick={() => onSetPinFilterExpanded(true)}
              className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
              aria-label="핀 아이콘 필터 펼치기"
              title="핀 아이콘 필터 펼치기"
            >
              +
            </button>
          </>
        )}
        </div>
      </div>

      {currentMode === TOOL_MODES.ADD_ROUTE && (
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow">
          <select
            value={routeDraft.travelMode || 'WALKING'}
            onChange={(event) => onSetRouteTravelMode(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
          >
            {routeTravelModeList.map((routeTravelModeItem) => (
              <option key={routeTravelModeItem.value} value={routeTravelModeItem.value}>
                {routeTravelModeItem.label}
              </option>
            ))}
          </select>
          <span className="text-gray-700">{routeDraft.start ? '도착점을 클릭해 경로를 완성하세요' : '출발점을 클릭하세요'}</span>
        </div>
      )}

      <RouteSummaryPopup routeInfo={recentRouteInfo} onClose={onCloseRouteSummary} />
    </>
  )
}

export default MapOverlays
