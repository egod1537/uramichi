import { useMemo, useState } from 'react'
import useMapStore from '../../stores/useMapStore'

const categoryIconMap = {
  default: '📍',
  airport: '✈️',
  station: '🚂',
  cafe: '☕',
  food: '🍜',
  photo: '📷',
  shopping: '🛍️',
  spot: '📍',
}

const transportIconMap = {
  flight: '✈️',
  train: '🚂',
  walk: '🚶',
  car: '🚗',
}

const getPinNameMap = (pins) =>
  pins.reduce((pinNameMap, pin) => {
    pinNameMap[pin.id] = pin.name
    return pinNameMap
  }, {})

function LayerRow({ layer }) {
  const pins = useMapStore((state) => state.pins)
  const toggleLayerVisibility = useMapStore((state) => state.toggleLayerVisibility)
  const toggleLayerCollapse = useMapStore((state) => state.toggleLayerCollapse)
  const renameLayer = useMapStore((state) => state.renameLayer)
  const removeLayer = useMapStore((state) => state.removeLayer)
  const selectPin = useMapStore((state) => state.selectPin)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const layerPins = useMemo(() => pins.filter((pin) => pin.layerId === layer.id), [pins, layer.id])
  const pinNameMap = useMemo(() => getPinNameMap(layerPins), [layerPins])

  return (
    <div className="border-b border-gray-200 py-2 last:border-b-0">
      <div className="flex items-center gap-2 px-2">
        <input
          type="checkbox"
          checked={layer.visible}
          onChange={() => toggleLayerVisibility(layer.id)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <button
          type="button"
          onClick={() => toggleLayerCollapse(layer.id)}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <span className="text-gray-500">{layer.collapsed ? '▸' : '▾'}</span>
          <span className="truncate text-left text-base text-gray-800">{layer.name}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((previousState) => !previousState)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="레이어 더보기"
          >
            ⋮
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-7 z-10 w-24 rounded border border-gray-200 bg-white py-1 shadow">
              <button
                type="button"
                onClick={() => {
                  const nextLayerName = window.prompt('레이어 이름 변경', layer.name)
                  if (nextLayerName?.trim()) {
                    renameLayer(layer.id, nextLayerName.trim())
                  }
                  setIsMenuOpen(false)
                }}
                className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                이름 변경
              </button>
              <button
                type="button"
                onClick={() => {
                  removeLayer(layer.id)
                  setIsMenuOpen(false)
                }}
                className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {!layer.collapsed && (
        <div className="mt-2 space-y-1 pl-8 pr-2">
          {layerPins.map((pin, pinIndex) => {
            const nextPin = layerPins[pinIndex + 1]
            const route = layer.routes.find(
              (routeItem) =>
                routeItem.fromPinId === pin.id &&
                routeItem.toPinId === nextPin?.id,
            )

            return (
              <div key={pin.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectPin(pin.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span>{categoryIconMap[pin.category] ?? categoryIconMap.default}</span>
                  <span className="truncate">{pin.name}</span>
                </button>

                {route && (
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                    <span>{transportIconMap[route.transport] ?? transportIconMap.walk}</span>
                    <span className="truncate">
                      {pinNameMap[route.fromPinId]} → {pinNameMap[route.toPinId]}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LayerPanel() {
  const layers = useMapStore((state) => state.layers)

  if (!layers.length) {
    return (
      <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {layers.map((layer) => (
        <LayerRow key={layer.id} layer={layer} />
      ))}
    </div>
  )
}
