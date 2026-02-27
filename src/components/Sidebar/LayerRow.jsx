import { useMemo, useState } from 'react'
import { CATEGORY_PRESETS, TRANSPORT_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'

function LayerRow({ layer }) {
  const pins = useProjectStore((state) => state.pins)
  const activeLayerId = useProjectStore((state) => state.activeLayerId)
  const setActiveLayer = useProjectStore((state) => state.setActiveLayer)
  const toggleLayerVisibility = useProjectStore((state) => state.toggleLayerVisibility)
  const toggleLayerCollapse = useProjectStore((state) => state.toggleLayerCollapse)
  const renameLayer = useProjectStore((state) => state.renameLayer)
  const removeLayer = useProjectStore((state) => state.removeLayer)
  const selectPin = useProjectStore((state) => state.selectPin)
  const removePin = useProjectStore((state) => state.removePin)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pinContextMenuPinId, setPinContextMenuPinId] = useState(null)

  const layerPins = useMemo(() => pins.filter((pinItem) => pinItem.layerId === layer.id), [layer.id, pins])
  const isActiveLayer = activeLayerId === layer.id

  const pinNameMap = useMemo(
    () =>
      layerPins.reduce((nameMap, pinItem) => {
        nameMap[pinItem.id] = pinItem.name
        return nameMap
      }, {}),
    [layerPins],
  )

  const handleRename = () => {
    const nextLayerName = window.prompt('레이어 이름 변경', layer.name)
    if (nextLayerName?.trim()) {
      renameLayer(layer.id, nextLayerName.trim())
    }
    setIsMenuOpen(false)
  }

  return (
    <div
      className={`border-b py-2 last:border-b-0 ${isActiveLayer ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200'}`}
      onClick={() => {
        if (pinContextMenuPinId) {
          setPinContextMenuPinId(null)
        }
      }}
    >
      <div className="flex items-center gap-2 px-2">
        <input
          type="checkbox"
          checked={layer.visible}
          onChange={() => toggleLayerVisibility(layer.id)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <button
          type="button"
          onClick={() => setActiveLayer(layer.id)}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <span
            className="text-gray-500"
            onClick={(event) => {
              event.stopPropagation()
              toggleLayerCollapse(layer.id)
            }}
          >
            {layer.collapsed ? '▸' : '▾'}
          </span>
          <span className={`truncate text-left text-base ${isActiveLayer ? 'font-semibold text-blue-700' : 'text-gray-800'}`}>{layer.name}</span>
        </button>

        <div className="relative">
          <button type="button" onClick={() => setIsMenuOpen((previousOpenState) => !previousOpenState)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="레이어 더보기">
            ⋮
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-7 z-10 w-24 rounded border border-gray-200 bg-white py-1 shadow">
              <button type="button" onClick={handleRename} className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100">
                이름 변경
              </button>
              <button type="button" onClick={() => removeLayer(layer.id)} className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100">
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {!layer.collapsed && (
        <div className="relative mt-2 space-y-1 pl-8 pr-2">
          {layerPins.map((pinItem, pinIndex) => {
            const nextPin = layerPins[pinIndex + 1]
            const routeItem = layer.routes.find((routeData) => routeData.fromPinId === pinItem.id && routeData.toPinId === nextPin?.id)
            return (
              <div key={pinItem.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectPin(pinItem.id)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    setPinContextMenuPinId(pinItem.id)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span>{CATEGORY_PRESETS[pinItem.category]?.icon ?? CATEGORY_PRESETS.default.icon}</span>
                  <span className="truncate">{pinItem.name}</span>
                </button>

                {routeItem && (
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                    <span>{TRANSPORT_PRESETS[routeItem.transport]?.icon ?? TRANSPORT_PRESETS.walk.icon}</span>
                    <span className="truncate">
                      {pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {pinContextMenuPinId && (
            <div className="absolute right-2 top-0 z-30 min-w-28 rounded border border-gray-200 bg-white py-1 shadow">
              <button
                type="button"
                onClick={() => {
                  removePin(pinContextMenuPinId)
                  setPinContextMenuPinId(null)
                }}
                className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100"
              >
                핀 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LayerRow
