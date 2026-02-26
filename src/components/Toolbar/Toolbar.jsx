import { useEffect, useMemo, useState } from 'react'
import useMapStore, { TOOL_MODES } from '../../stores/useMapStore'
import Search from './Search'
import ToolButton from './ToolButton'

const modeButtons = [
  { key: TOOL_MODES.SELECT, label: 'Select/Pan', icon: '🖐️' },
  { key: TOOL_MODES.ADD_MARKER, label: 'Add Marker', icon: '📍' },
  { key: TOOL_MODES.DRAW_LINE, label: 'Draw Line', icon: '✏️' },
  { key: TOOL_MODES.ADD_ROUTE, label: 'Add Route', icon: '🛤️' },
  { key: TOOL_MODES.MEASURE_DISTANCE, label: 'Measure Distance', icon: '📐' },
]

const toolbarButtons = [
  { key: 'undo', label: 'Undo', icon: '↩' },
  { key: 'redo', label: 'Redo', icon: '↪' },
  ...modeButtons,
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
]

export default function Toolbar() {
  const currentMode = useMapStore((state) => state.currentMode)
  const historyIndex = useMapStore((state) => state.historyIndex)
  const historyLength = useMapStore((state) => state.history.length)
  const isShortcutModalOpen = useMapStore((state) => state.isShortcutModalOpen)
  const setMode = useMapStore((state) => state.setMode)
  const resetToSelectMode = useMapStore((state) => state.resetToSelectMode)
  const undo = useMapStore((state) => state.undo)
  const redo = useMapStore((state) => state.redo)
  const setShortcutModalOpen = useMapStore((state) => state.setShortcutModalOpen)
  const [searchValue, setSearchValue] = useState('')

  const buttonDisabledState = useMemo(
    () => ({
      undo: historyIndex === 0,
      redo: historyIndex >= historyLength - 1,
    }),
    [historyIndex, historyLength],
  )

  useEffect(() => {
    const handleKeydown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        resetToSelectMode()
      }

      if (keyboardEvent.key.toLowerCase() === 'u') {
        undo()
      }

      if (keyboardEvent.key.toLowerCase() === 'r') {
        redo()
      }

      if (keyboardEvent.key.toLowerCase() === 'm') {
        setMode(TOOL_MODES.ADD_MARKER)
      }

      if (keyboardEvent.key.toLowerCase() === 'l') {
        setMode(TOOL_MODES.DRAW_LINE)
      }

      if (keyboardEvent.key.toLowerCase() === 't') {
        setMode(TOOL_MODES.ADD_ROUTE)
      }

      if (keyboardEvent.key.toLowerCase() === 'd') {
        setMode(TOOL_MODES.MEASURE_DISTANCE)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [resetToSelectMode, redo, setMode, undo])

  const handleToolbarButtonClick = (buttonKey) => {
    if (buttonKey === 'undo') {
      undo()
      return
    }

    if (buttonKey === 'redo') {
      redo()
      return
    }

    if (buttonKey === 'shortcuts') {
      setShortcutModalOpen(true)
      return
    }

    setMode(buttonKey)
  }

  return (
    <>
      <div className="absolute left-1/2 top-3 z-20 w-[min(96vw,560px)] -translate-x-1/2">
        <div className="overflow-hidden rounded-sm bg-white shadow-[0_2px_8px_rgba(60,64,67,0.35)]">
          <div className="flex items-center border-b border-gray-200 p-1.5">
            <Search value={searchValue} onValueChange={setSearchValue} className="h-9 rounded-sm border-0" />
            <button
              type="button"
              className="ml-1.5 flex h-9 w-10 items-center justify-center rounded-sm bg-blue-500 text-lg text-white hover:bg-blue-600"
              aria-label="검색"
            >
              🔍
            </button>
          </div>
          <div className="flex items-center gap-1 p-1.5">
            {toolbarButtons.map((button) => {
              const isModeButton = modeButtons.some((modeButton) => modeButton.key === button.key)
              const isActive = isModeButton && currentMode === button.key
              const isDisabled = buttonDisabledState[button.key]

              return (
                <ToolButton
                  key={button.key}
                  buttonKey={button.key}
                  label={button.label}
                  icon={button.icon}
                  isActive={isActive}
                  isDisabled={isDisabled}
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
