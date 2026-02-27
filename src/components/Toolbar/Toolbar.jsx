import { useCallback, useEffect } from 'react'
import TOOL_MODES from '../../utils/toolModes'
import Search from './Search'
import ToolButton from './ToolButton'
import useEditorStore from '../../stores/useEditorStore'
import useProjectStore from '../../stores/useProjectStore'

const toolbarButtons = [
  { key: 'undo', label: 'Undo', icon: '↩', tooltip: 'Undo (Z)', shortcut: 'Z' },
  { key: 'redo', label: 'Redo', icon: '↪', tooltip: 'Redo (Y)', shortcut: 'Y' },
  { key: TOOL_MODES.SELECT, label: 'Select/Pan', icon: '🖐️', tooltip: 'Select/Pan (Q)', shortcut: 'Q' },
  { key: TOOL_MODES.ADD_MARKER, label: 'Add Marker', icon: '📍', tooltip: 'Add Marker (W)', shortcut: 'W' },
  { key: TOOL_MODES.DRAW_LINE, label: 'Draw Line', icon: '✏️', tooltip: 'Draw Line (E)', shortcut: 'E' },
  { key: TOOL_MODES.ADD_ROUTE, label: 'Add Route', icon: '🛤️', tooltip: 'Add Route (R)', shortcut: 'R' },
  { key: TOOL_MODES.MEASURE_DISTANCE, label: 'Measure Distance', icon: '📐', tooltip: 'Measure Distance (T)', shortcut: 'T' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', tooltip: 'Keyboard Shortcuts' },
]

function Toolbar({ currentMode, historyIndex, historyLength }) {
  const isShortcutModalOpen = useEditorStore((state) => state.isShortcutModalOpen)
  const setShortcutModalOpen = useEditorStore((state) => state.setShortcutModalOpen)
  const setMode = useProjectStore((state) => state.setMode)
  const resetToSelectMode = useProjectStore((state) => state.resetToSelectMode)
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)

  const handleKeydown = useCallback(
    (event) => {
      const eventTarget = event.target
      const isInputControlTarget =
        eventTarget instanceof HTMLElement
        && (eventTarget.tagName === 'INPUT'
          || eventTarget.tagName === 'TEXTAREA'
          || eventTarget.tagName === 'SELECT'
          || eventTarget.isContentEditable)
      if (isInputControlTarget && event.key !== 'Escape') return

      const loweredKey = event.key.toLowerCase()
      if (event.key === 'Escape') resetToSelectMode()
      if (loweredKey === 'z') undo()
      if (loweredKey === 'y') redo()
      if (loweredKey === 'q') setMode(TOOL_MODES.SELECT)
      if (loweredKey === 'w') setMode(TOOL_MODES.ADD_MARKER)
      if (loweredKey === 'e') setMode(TOOL_MODES.DRAW_LINE)
      if (loweredKey === 'r') setMode(TOOL_MODES.ADD_ROUTE)
      if (loweredKey === 't') setMode(TOOL_MODES.MEASURE_DISTANCE)
    },
    [redo, resetToSelectMode, setMode, undo],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  const handleToolbarButtonClick = (buttonKey) => {
    if (buttonKey === 'undo') return undo()
    if (buttonKey === 'redo') return redo()
    if (buttonKey === 'shortcuts') return setShortcutModalOpen(true)
    return setMode(buttonKey)
  }

  const buttonDisabledState = {
    undo: historyIndex === 0,
    redo: historyIndex >= historyLength - 1,
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
                  isDisabled={buttonDisabledState[buttonItem.key]}
                  tooltip={buttonItem.tooltip}
                  shortcut={buttonItem.shortcut}
                  onClick={handleToolbarButtonClick}
                />
              )
            })}
          </div>
        </div>
      </div>

      {isShortcutModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>ESC: Select/Pan 모드로 복귀</li>
              <li>Z: Undo</li>
              <li>Y: Redo</li>
              <li>Q: Select/Pan 모드</li>
              <li>W: Add Marker 모드</li>
              <li>E: Draw Line 모드</li>
              <li>R: Add Route 모드</li>
              <li>T: Measure Distance 모드</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShortcutModalOpen(false)}
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

export default Toolbar
