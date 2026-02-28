import React from 'react'
import TOOL_MODES from '../../utils/toolModes'
import { ICON_FILTER_OPTIONS } from '../../utils/opts'
import { convertTimeStringToMinutes } from '../../utils/time'
import Search from './Search'
import ToolButton from './ToolButton'
import useEditorStore from '../../stores/useEditorStore'
import useProjectStore from '../../stores/useProjectStore'

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

const toolbarButtons = [
  { key: TOOL_MODES.SELECT, label: 'Select/Pan', icon: '🖐️', tooltip: '선택/이동 (Q)', shortcut: 'Q' },
  { key: TOOL_MODES.ADD_MARKER, label: 'Add Marker', icon: '📍', tooltip: '핀 추가 (W)', shortcut: 'W' },
  { key: TOOL_MODES.DRAW_LINE, label: 'Draw Line', icon: '📏', tooltip: '선 그리기 (E)', shortcut: 'E' },
  { key: TOOL_MODES.ADD_ROUTE, label: 'Add Route', icon: '🛤️', tooltip: '경로 추가 (R)', shortcut: 'R' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', tooltip: '단축키 목록' },
]

class Toolbar extends React.Component {
  state = {
    isShortcutModalOpen: useEditorStore.getState().isShortcutModalOpen,
    isFilterPanelOpen: false,
    activeTimeSliderHandle: 'end',
    pinIconFilters: useProjectStore.getState().pinIconFilters,
    timeFilterRange: useProjectStore.getState().timeFilterRange,
  }

  componentDidMount() {
    this.unsubscribeEditorStore = useEditorStore.subscribe((state) => {
      this.setState({ isShortcutModalOpen: state.isShortcutModalOpen })
    })
    this.unsubscribeProjectStore = useProjectStore.subscribe((state) => {
      this.setState({
        pinIconFilters: state.pinIconFilters,
        timeFilterRange: state.timeFilterRange,
      })
    })
    window.addEventListener('keydown', this.handleKeydown)
  }

  componentWillUnmount() {
    if (this.unsubscribeEditorStore) {
      this.unsubscribeEditorStore()
    }
    if (this.unsubscribeProjectStore) {
      this.unsubscribeProjectStore()
    }
    window.removeEventListener('keydown', this.handleKeydown)
  }

  handleKeydown = (event) => {
    const eventTarget = event.target
    const isInputControlTarget =
      eventTarget instanceof HTMLElement
      && (eventTarget.tagName === 'INPUT'
        || eventTarget.tagName === 'TEXTAREA'
        || eventTarget.tagName === 'SELECT'
        || eventTarget.isContentEditable)
    if (isInputControlTarget && event.key !== 'Escape') return

    const projectStore = useProjectStore.getState()
    const loweredKey = event.key.toLowerCase()
    if (event.key === 'Escape') projectStore.resetToSelectMode()
    if ((event.ctrlKey || event.metaKey) && loweredKey === 'z') {
      event.preventDefault()
      projectStore.undo()
      return
    }
    if ((event.ctrlKey || event.metaKey) && loweredKey === 'r') {
      event.preventDefault()
      projectStore.redo()
      return
    }
    if (loweredKey === 'q') projectStore.setMode(TOOL_MODES.SELECT)
    if (loweredKey === 'w') projectStore.setMode(TOOL_MODES.ADD_MARKER)
    if (loweredKey === 'e') projectStore.setMode(TOOL_MODES.DRAW_LINE)
    if (loweredKey === 'r') projectStore.setMode(TOOL_MODES.ADD_ROUTE)
  }

  handleToolbarButtonClick = (buttonKey) => {
    const projectStore = useProjectStore.getState()
    if (buttonKey === 'shortcuts') return useEditorStore.getState().setShortcutModalOpen(true)
    return projectStore.setMode(buttonKey)
  }

  handleCloseShortcutModal = () => {
    useEditorStore.getState().setShortcutModalOpen(false)
  }


  handleToggleFilterPanel = () => {
    this.setState((previousState) => ({ isFilterPanelOpen: !previousState.isFilterPanelOpen }))
  }

  handleCloseFilterPanel = () => {
    this.setState({ isFilterPanelOpen: false })
  }

  handleStartSliderChange = (nextStartMinutesText) => {
    const projectStore = useProjectStore.getState()
    const startMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(projectStore.timeFilterRange.start), 9 * 60)
    const endMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(projectStore.timeFilterRange.end), 18 * 60)
    const sliderStartMinutes = Math.min(startMinutes, endMinutes)
    const sliderEndMinutes = Math.max(startMinutes, endMinutes)
    const nextStartMinutes = normalizeSliderMinutes(Number(nextStartMinutesText), sliderStartMinutes)
    const resolvedStartMinutes = Math.min(nextStartMinutes, sliderEndMinutes)
    projectStore.setTimeFilterRange('start', convertMinutesToTimeText(resolvedStartMinutes))
  }

  handleEndSliderChange = (nextEndMinutesText) => {
    const projectStore = useProjectStore.getState()
    const startMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(projectStore.timeFilterRange.start), 9 * 60)
    const endMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(projectStore.timeFilterRange.end), 18 * 60)
    const sliderStartMinutes = Math.min(startMinutes, endMinutes)
    const sliderEndMinutes = Math.max(startMinutes, endMinutes)
    const nextEndMinutes = normalizeSliderMinutes(Number(nextEndMinutesText), sliderEndMinutes)
    const resolvedEndMinutes = Math.max(nextEndMinutes, sliderStartMinutes)
    projectStore.setTimeFilterRange('end', convertMinutesToTimeText(resolvedEndMinutes))
  }

  render() {
    const { currentMode } = this.props
    const { isFilterPanelOpen, activeTimeSliderHandle, pinIconFilters, timeFilterRange } = this.state
    const activePinFilterItems = ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key))
    const startMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(timeFilterRange.start), 9 * 60)
    const endMinutes = normalizeSliderMinutes(convertTimeStringToMinutes(timeFilterRange.end), 18 * 60)
    const sliderStartMinutes = Math.min(startMinutes, endMinutes)
    const sliderEndMinutes = Math.max(startMinutes, endMinutes)
    const sliderRangeWidthPercent = ((sliderEndMinutes - sliderStartMinutes) / TIME_SLIDER_MINUTES_MAX) * 100
    const sliderRangeLeftPercent = (sliderStartMinutes / TIME_SLIDER_MINUTES_MAX) * 100

    return (
      <>
        <div className="absolute top-3 left-1/2 z-20 w-[min(95vw,580px)] -translate-x-1/2">
          <div className="rounded-md bg-white shadow-[0_2px_8px_rgba(60,64,67,0.3)]">
            <div className="flex items-center gap-2 p-1.5">
              <Search />
              <button
                type="button"
                className="flex h-9 w-10 items-center justify-center rounded-sm bg-[#4285f4] text-white hover:bg-[#3367d6]"
                aria-label="검색"
                title="장소 검색"
              >
                🔍
              </button>
            </div>
            <div className="flex items-center gap-1 p-1">
              {toolbarButtons.map((buttonItem) => {
                const isModeButton = Object.values(TOOL_MODES).includes(buttonItem.key)
                const isActive = isModeButton && currentMode === buttonItem.key
                return (
                  <ToolButton
                    key={buttonItem.key}
                    buttonKey={buttonItem.key}
                    label={buttonItem.label}
                    icon={buttonItem.icon}
                    isActive={isActive}
                    isDisabled={false}
                    tooltip={buttonItem.tooltip}
                    shortcut={buttonItem.shortcut}
                    onClick={this.handleToolbarButtonClick}
                  />
                )
              })}
              <div className="ml-auto flex items-center gap-2 pr-1">
                <div className="hidden max-w-[220px] truncate rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 sm:block">
                  {activePinFilterItems.length > 0 || timeFilterRange.start !== '00:00' || timeFilterRange.end !== '24:00'
                    ? `${timeFilterRange.start}~${timeFilterRange.end} · 아이콘 ${activePinFilterItems.length}개`
                    : '필터 없음'}
                </div>
                <button
                  type="button"
                  onClick={this.handleToggleFilterPanel}
                  className={`flex h-9 items-center gap-1 rounded-md border px-2 text-sm transition ${isFilterPanelOpen ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                  title="필터"
                >
                  <img src="/svg/map-pin-filter.svg" alt="" className="h-4 w-4" />
                  필터
                </button>
              </div>
            </div>
          </div>
        </div>


        {isFilterPanelOpen && (
          <div className="absolute right-4 top-20 z-30 w-[340px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">지도 필터</h3>
              <button type="button" onClick={this.handleCloseFilterPanel} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
                닫기
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                  <span>시간 필터</span>
                  <span>{timeFilterRange.start} ~ {timeFilterRange.end}</span>
                </div>
                <div className="relative h-6">
                  <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-gray-200" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-orange-300"
                    style={{ left: `${sliderRangeLeftPercent}%`, width: `${sliderRangeWidthPercent}%` }}
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
                    className={`map-time-range-slider absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent ${activeTimeSliderHandle === 'start' ? 'z-40' : 'z-20'}`}
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
                    className={`map-time-range-slider absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent ${activeTimeSliderHandle === 'end' ? 'z-40' : 'z-30'}`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                  <span>핀 아이콘 필터</span>
                  <button
                    type="button"
                    onClick={() => useProjectStore.getState().clearPinIconFilter()}
                    className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50"
                    disabled={!pinIconFilters.length}
                  >
                    초기화
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ICON_FILTER_OPTIONS.map((filterItem) => {
                    const isActive = pinIconFilters.includes(filterItem.key)
                    return (
                      <button
                        key={`toolbar-filter-${filterItem.key}`}
                        type="button"
                        onClick={() => useProjectStore.getState().togglePinIconFilter(filterItem.key)}
                        className={`rounded-full border px-2 py-1 ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                      >
                        <img src={filterItem.svgPath} alt={filterItem.label} className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {this.state.isShortcutModalOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
              <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>ESC: Select/Pan 모드로 복귀</li>
                <li>Ctrl+Z: Undo</li>
                <li>Ctrl+R: Redo</li>
                <li>Q: Select/Pan 모드</li>
                <li>W: Add Marker 모드</li>
                <li>E: Draw Line 모드</li>
                <li>R: Add Route 모드</li>
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={this.handleCloseShortcutModal}
                  className="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
}

export default Toolbar
