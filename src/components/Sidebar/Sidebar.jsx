import LayerPanel from './LayerPanel'
import MapPanel from './MapPanel'
import useEditorStore from '../../stores/useEditorStore'

function Sidebar() {
  const sidebarOpen = useEditorStore((state) => state.sidebarOpen)
  const setSidebarOpen = useEditorStore((state) => state.setSidebarOpen)

  if (!sidebarOpen) {
    return (
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="absolute left-4 top-4 z-20 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow"
      >
        패널 열기
      </button>
    )
  }

  return (
    <aside className="absolute left-4 top-4 z-20 flex h-[calc(100vh-2rem)] w-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-end border-b border-gray-200 px-2 py-1">
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>
      <MapPanel />
      <LayerPanel />
    </aside>
  )
}

export default Sidebar
