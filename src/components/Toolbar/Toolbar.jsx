import React from 'react'
import TOOL_MODES from '../../utils/toolModes'
import Search from './Search'
import ToolButton from './ToolButton'

const toolbarButtons = [
  { key: 'undo', label: 'Undo', icon: '↩' },
  { key: 'redo', label: 'Redo', icon: '↪' },
  { key: TOOL_MODES.SELECT, label: 'Select/Pan', icon: '🖐️' },
  { key: TOOL_MODES.ADD_MARKER, label: 'Add Marker', icon: '📍' },
  { key: TOOL_MODES.DRAW_LINE, label: 'Draw Line', icon: '✏️' },
  { key: TOOL_MODES.ADD_ROUTE, label: 'Add Route', icon: '🛤️' },
  { key: TOOL_MODES.MEASURE_DISTANCE, label: 'Measure Distance', icon: '📐' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
]

class Toolbar extends React.Component {
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeydown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  }

  handleKeydown = (event) => {
    const loweredKey = event.key.toLowerCase()
    if (event.key === 'Escape') this.props.resetToSelectMode()
    if (loweredKey === 'u') this.props.undo()
    if (loweredKey === 'r') this.props.redo()
    if (loweredKey === 'm') this.props.setMode(TOOL_MODES.ADD_MARKER)
    if (loweredKey === 'l') this.props.setMode(TOOL_MODES.DRAW_LINE)
    if (loweredKey === 't') this.props.setMode(TOOL_MODES.ADD_ROUTE)
    if (loweredKey === 'd') this.props.setMode(TOOL_MODES.MEASURE_DISTANCE)
  }

  handleToolbarButtonClick = (buttonKey) => {
    if (buttonKey === 'undo') {
      this.props.undo()
      return
    }
    if (buttonKey === 'redo') {
      this.props.redo()
      return
    }
    if (buttonKey === 'shortcuts') {
      this.props.setShortcutModalOpen(true)
      return
    }
    this.props.setMode(buttonKey)
  }

  render() {
    const buttonDisabledState = {
      undo: this.props.historyIndex === 0,
      redo: this.props.historyIndex >= this.props.historyLength - 1,
    }

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
              >
                🔍
              </button>
            </div>
            <div className="flex items-center gap-1 p-1">
              {toolbarButtons.map((buttonItem) => {
                const isModeButton = Object.values(TOOL_MODES).includes(buttonItem.key)
                const isActive = isModeButton && this.props.currentMode === buttonItem.key
                return (
                  <ToolButton
                    key={buttonItem.key}
                    buttonKey={buttonItem.key}
                    label={buttonItem.label}
                    icon={buttonItem.icon}
                    isActive={isActive}
                    isDisabled={buttonDisabledState[buttonItem.key]}
                    onClick={this.handleToolbarButtonClick}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {this.props.isShortcutModalOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
              <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>ESC: Select/Pan 모드로 복귀</li>
                <li>U: Undo</li>
                <li>R: Redo</li>
                <li>M: Add Marker 모드</li>
                <li>L: Draw Line 모드</li>
                <li>T: Add Route 모드</li>
                <li>D: Measure Distance 모드</li>
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => this.props.setShortcutModalOpen(false)}
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
