import { useEffect, useMemo } from 'react'
import { TOOL_MODES, useToolbarStore } from '../../stores/toolbarStore'
import useMapStore from '../../stores/useMapStore'
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

export default function Toolbar() {
  const mode = useToolbarStore((state) => state.mode)
  const historyIndex = useToolbarStore((state) => state.historyIndex)
  const historyLength = useToolbarStore((state) => state.history.length)
  const isShortcutModalOpen = useToolbarStore((state) => state.isShortcutModalOpen)
  const setMode = useToolbarStore((state) => state.setMode)
  const resetToSelectMode = useToolbarStore((state) => state.resetToSelectMode)
  const undo = useToolbarStore((state) => state.undo)
  const redo = useToolbarStore((state) => state.redo)
  const setShortcutModalOpen = useToolbarStore((state) => state.setShortcutModalOpen)
  const mapHistoryIndex = useMapStore((state) => state.historyIndex)
  const mapHistoryLength = useMapStore((state) => state.history.length)
  const setMapMode = useMapStore((state) => state.setMode)
  const undoPinHistory = useMapStore((state) => state.undo)
  const redoPinHistory = useMapStore((state) => state.redo)

  const buttonDisabledState = useMemo(
    () => ({
      undo: historyIndex === 0 && mapHistoryIndex === 0,
      redo: historyIndex >= historyLength - 1 && mapHistoryIndex >= mapHistoryLength - 1,
    }),
    [historyIndex, historyLength, mapHistoryIndex, mapHistoryLength],
  )

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        resetToSelectMode()
        setMapMode('select')
      }

      if (event.key.toLowerCase() === 'u') {
        undo()
        undoPinHistory()
      }

      if (event.key.toLowerCase() === 'r') {
        redo()
        redoPinHistory()
      }

      if (event.key.toLowerCase() === 'm') {
        setMode(TOOL_MODES.ADD_MARKER)
        setMapMode('addMarker')
      }

      if (event.key.toLowerCase() === 'l') {
        setMode(TOOL_MODES.DRAW_LINE)
        setMapMode('select')
      }

      if (event.key.toLowerCase() === 't') {
        setMode(TOOL_MODES.ADD_ROUTE)
        setMapMode('select')
      }

      if (event.key.toLowerCase() === 'd') {
        setMode(TOOL_MODES.MEASURE_DISTANCE)
        setMapMode('select')
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [resetToSelectMode, redo, redoPinHistory, setMapMode, setMode, undo, undoPinHistory])

  const handleToolbarButtonClick = (buttonKey) => {
    if (buttonKey === 'undo') {
      undo()
      undoPinHistory()
      return
    }

    if (buttonKey === 'redo') {
      redo()
      redoPinHistory()
      return
    }

    if (buttonKey === 'shortcuts') {
      setShortcutModalOpen(true)
      return
    }

    setMode(buttonKey)
    setMapMode(buttonKey === TOOL_MODES.ADD_MARKER ? 'addMarker' : 'select')
  }

  return (
    <>
      <div className="absolute top-3 left-1/2 z-20 w-[min(96vw,580px)] -translate-x-1/2">
        <div className="rounded-md bg-white shadow-[0_2px_8px_rgba(60,64,67,0.3)]">
          <div className="flex items-center gap-2 border-b border-gray-200 p-2">
            <Search />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-sm bg-blue-500 text-white hover:bg-blue-600"
              aria-label="검색"
            >
              🔍
            </button>
          </div>
          <div className="flex items-center gap-1 p-1.5">
            {toolbarButtons.map((button) => {
              const isModeButton = Object.values(TOOL_MODES).includes(button.key)
              const isActive = isModeButton && mode === button.key
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
