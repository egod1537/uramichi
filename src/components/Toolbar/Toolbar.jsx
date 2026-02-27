import React from 'react'
import TOOL_MODES from '../../utils/toolModes'
import Search from './Search'
import ToolButton from './ToolButton'
import useEditorStore from '../../stores/useEditorStore'
import useProjectStore from '../../stores/useProjectStore'

const toolbarButtons = [
  { key: TOOL_MODES.SELECT, label: 'Select/Pan', icon: '🖐️', tooltip: '선택/이동 (Q)', shortcut: 'Q' },
  { key: TOOL_MODES.ADD_MARKER, label: 'Add Marker', icon: '📍', tooltip: '핀 추가 (W)', shortcut: 'W' },
  { key: TOOL_MODES.DRAW_LINE, label: 'Draw Line', icon: '✏️', tooltip: '선 그리기 (E)', shortcut: 'E' },
  { key: TOOL_MODES.ADD_ROUTE, label: 'Add Route', icon: '🛤️', tooltip: '경로 추가 (R)', shortcut: 'R' },
  { key: TOOL_MODES.MEASURE_DISTANCE, label: 'Measure Distance', icon: '📐', tooltip: '거리 측정 (T, 우클릭 종료·저장 안 됨)', shortcut: 'T' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', tooltip: '단축키 목록' },
]

class Toolbar extends React.Component {
  state = {
    isShortcutModalOpen: useEditorStore.getState().isShortcutModalOpen,
  }

  componentDidMount() {
    this.unsubscribeEditorStore = useEditorStore.subscribe((state) => {
      this.setState({ isShortcutModalOpen: state.isShortcutModalOpen })
    })
    window.addEventListener('keydown', this.handleKeydown)
  }

  componentWillUnmount() {
    if (this.unsubscribeEditorStore) {
      this.unsubscribeEditorStore()
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
    if (event.key === 'Escape' && projectStore.currentMode !== TOOL_MODES.DRAW_LINE) projectStore.resetToSelectMode()
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
    if (loweredKey === 't') projectStore.setMode(TOOL_MODES.MEASURE_DISTANCE)
  }

  handleToolbarButtonClick = (buttonKey) => {
    const projectStore = useProjectStore.getState()
    if (buttonKey === 'shortcuts') return useEditorStore.getState().setShortcutModalOpen(true)
    return projectStore.setMode(buttonKey)
  }

  handleCloseShortcutModal = () => {
    useEditorStore.getState().setShortcutModalOpen(false)
  }

  render() {
    const { currentMode } = this.props

    return (
      <>
        <div className="absolute top-3 left-1/2 z-20 w-[min(95vw,580px)] -translate-x-1/2">
          <div className="rounded-md bg-white shadow-[0_2px_8px_rgba(60,64,67,0.3)]">
            <div className="flex items-center gap-2 border-b border-gray-200 p-1.5">
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
            </div>
          </div>
        </div>

        {this.state.isShortcutModalOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
              <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>ESC: Select/Pan 모드로 복귀 (선 그리기 모드 제외)</li>
                <li>Ctrl+Z: Undo</li>
                <li>Ctrl+R: Redo</li>
                <li>Q: Select/Pan 모드</li>
                <li>W: Add Marker 모드</li>
                <li>E: Draw Line 모드</li>
                <li>R: Add Route 모드</li>
                <li>T: Measure Distance 모드 (우클릭 종료, 저장 안 됨)</li>
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
