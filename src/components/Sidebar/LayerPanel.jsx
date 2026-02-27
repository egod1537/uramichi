import { useMemo, useState } from 'react'
import LayerRow from './LayerRow'
import useProjectStore from '../../stores/useProjectStore'

function LayerPanel() {
  const layers = useProjectStore((state) => state.layers)
  const pins = useProjectStore((state) => state.pins)
  const selectedPinIds = useProjectStore((state) => state.selectedPinIds)
  const routes = useProjectStore((state) => state.routes)
  const removePins = useProjectStore((state) => state.removePins)
  const movePinsToLayer = useProjectStore((state) => state.movePinsToLayer)
  const [targetLayerId, setTargetLayerId] = useState('')

  const selectedPinCount = selectedPinIds.length



  const routeSummaryList = useMemo(
    () =>
      routes.map((routeItem, routeIndex) => ({
        id: routeItem.id || `route-${routeIndex + 1}`,
        label: routeItem.summary || 'A → B',
      })),
    [routes],
  )

  const movableLayerOptions = useMemo(() => {
    if (!selectedPinIds.length) return layers
    const selectedLayerIdSet = new Set(pins.filter((pinItem) => selectedPinIds.includes(pinItem.id)).map((pinItem) => pinItem.layerId))
    return layers.filter((layerItem) => !selectedLayerIdSet.has(layerItem.id))
  }, [layers, pins, selectedPinIds])

  if (!layers.length) {
    return <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <div className="mb-2 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
        <p className="text-sm text-gray-700">선택된 핀 {selectedPinCount}개</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!selectedPinCount}
            onClick={() => removePins(selectedPinIds)}
            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            일괄 삭제
          </button>
          <select
            value={targetLayerId}
            disabled={!selectedPinCount}
            onChange={(event) => setTargetLayerId(event.target.value)}
            className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="">이동할 레이어 선택</option>
            {movableLayerOptions.map((layerItem) => (
              <option key={layerItem.id} value={layerItem.id}>
                {layerItem.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedPinCount || !targetLayerId}
            onClick={() => {
              movePinsToLayer(selectedPinIds, targetLayerId)
              setTargetLayerId('')
            }}
            className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            일괄 이동
          </button>
        </div>
      </div>

      <div className="mb-2 rounded-md border border-gray-200 bg-white p-2">
        <p className="mb-1 text-xs font-medium text-gray-500">경로 목록</p>
        {routeSummaryList.length ? (
          <ul className="space-y-1 text-sm text-gray-700">
            {routeSummaryList.map((routeSummaryItem) => (
              <li key={routeSummaryItem.id} className="truncate">
                {routeSummaryItem.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">경로가 없습니다.</p>
        )}
      </div>

      {layers.map((layerItem) => (
        <LayerRow key={layerItem.id} layer={layerItem} />
      ))}
    </div>
  )
}

export default LayerPanel
