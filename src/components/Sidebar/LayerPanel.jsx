import { useEffect, useMemo, useState } from 'react'
import LayerRow from './LayerRow'
import useProjectStore from '../../stores/useProjectStore'
import { ICON_FILTER_OPTIONS } from '../../utils/constants'

const findPinNameByPosition = (pinList, targetPosition) => {
  if (!targetPosition) return 'Unknown'
  const matchedPin = pinList.find(
    (pinItem) =>
      Math.abs(pinItem.position.lat - targetPosition.lat) < 0.000001 && Math.abs(pinItem.position.lng - targetPosition.lng) < 0.000001,
  )
  return matchedPin?.name || `${targetPosition.lat.toFixed(3)}, ${targetPosition.lng.toFixed(3)}`
}

function LayerPanel() {
  const layers = useProjectStore((state) => state.layers)
  const pins = useProjectStore((state) => state.pins)
  const routes = useProjectStore((state) => state.routes)
  const measurements = useProjectStore((state) => state.measurements)
  const selectedPinIds = useProjectStore((state) => state.selectedPinIds)
  const removePins = useProjectStore((state) => state.removePins)
  const movePinsToLayer = useProjectStore((state) => state.movePinsToLayer)
  const reorderLayers = useProjectStore((state) => state.reorderLayers)
  const pinIconFilters = useProjectStore((state) => state.pinIconFilters)
  const togglePinIconFilter = useProjectStore((state) => state.togglePinIconFilter)
  const clearPinIconFilter = useProjectStore((state) => state.clearPinIconFilter)
  const [targetLayerId, setTargetLayerId] = useState('')
  const [dragLayerId, setDragLayerId] = useState(null)
  const [layerDropPreview, setLayerDropPreview] = useState(null)
  const [focusedRenameTarget, setFocusedRenameTarget] = useState(null)
  const [editingRenameTarget, setEditingRenameTarget] = useState(null)

  const selectedPinCount = selectedPinIds.length

  const filteredPins = useMemo(() => {
    if (!pinIconFilters.length) return pins
    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.icon))
    return pins.filter((pinItem) => activeIconSet.has(pinItem.icon))
  }, [pinIconFilters, pins])

  const movableLayerOptions = useMemo(() => {
    if (!selectedPinIds.length) return layers
    const selectedLayerIdSet = new Set(pins.filter((pinItem) => selectedPinIds.includes(pinItem.id)).map((pinItem) => pinItem.layerId))
    return layers.filter((layerItem) => !selectedLayerIdSet.has(layerItem.id))
  }, [layers, pins, selectedPinIds])

  const routeSummaryList = useMemo(
    () =>
      routes.map((routeItem) => ({
        id: routeItem.id,
        label: `${findPinNameByPosition(pins, routeItem.start)} → ${findPinNameByPosition(pins, routeItem.end)}`,
      })),
    [pins, routes],
  )

  useEffect(() => {
    const handleF2Keydown = (event) => {
      if (event.key !== 'F2') return
      if (!focusedRenameTarget?.id) return
      event.preventDefault()
      setEditingRenameTarget(focusedRenameTarget)
    }

    window.addEventListener('keydown', handleF2Keydown)
    return () => window.removeEventListener('keydown', handleF2Keydown)
  }, [focusedRenameTarget])

  if (!layers.length) {
    return <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <div className="mb-2 rounded-md border border-gray-200 bg-white p-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">핀 아이콘 필터</p>
          <button
            type="button"
            onClick={clearPinIconFilter}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
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
                key={filterItem.key}
                type="button"
                onClick={() => togglePinIconFilter(filterItem.key)}
                className={`rounded-full border px-2 py-0.5 text-xs ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
              >
                {filterItem.icon} {filterItem.label}
              </button>
            )
          })}
        </div>
      </div>

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

      {!!routeSummaryList.length && (
        <div className="mb-2 rounded-md border border-gray-200 bg-white p-2">
          <p className="mb-1 text-xs font-semibold text-gray-500">경로</p>
          <ul className="space-y-1">
            {routeSummaryList.map((routeSummaryItem) => (
              <li key={routeSummaryItem.id} className="truncate text-sm text-gray-700">
                {routeSummaryItem.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {layers.map((layerItem) => (
        <LayerRow
          key={layerItem.id}
          layer={layerItem}
          filteredPins={filteredPins}
          measurements={measurements}
          isDraggingLayer={dragLayerId === layerItem.id}
          layerDropPreview={layerDropPreview}
          onLayerDragStart={(layerId) => setDragLayerId(layerId)}
          onLayerDragEnd={() => {
            setDragLayerId(null)
            setLayerDropPreview(null)
          }}
          onLayerDragOver={(targetLayerId, dropPosition) => {
            if (!dragLayerId || dragLayerId === targetLayerId) {
              setLayerDropPreview(null)
              return
            }
            setLayerDropPreview({ targetLayerId, dropPosition })
          }}
          onLayerDrop={(targetLayerId, dropPosition) => {
            if (!dragLayerId) return
            reorderLayers(dragLayerId, targetLayerId, dropPosition)
            setDragLayerId(null)
            setLayerDropPreview(null)
          }}
          focusedRenameTarget={focusedRenameTarget}
          editingRenameTarget={editingRenameTarget}
          onFocusRenameTarget={setFocusedRenameTarget}
          onStartRename={(renameTarget) => {
            setFocusedRenameTarget(renameTarget)
            setEditingRenameTarget(renameTarget)
          }}
          onFinishRename={() => setEditingRenameTarget(null)}
        />
      ))}
      <div
        className={`h-1 rounded bg-blue-500 transition-opacity ${layerDropPreview?.targetLayerId === '__end__' ? 'opacity-100' : 'opacity-0'}`}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!dragLayerId) return
          setLayerDropPreview({ targetLayerId: '__end__', dropPosition: 'end' })
        }}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!dragLayerId || !layers.length) return
          reorderLayers(dragLayerId, layers[layers.length - 1].id, 'end')
          setDragLayerId(null)
          setLayerDropPreview(null)
        }}
      />
    </div>
  )
}

export default LayerPanel
