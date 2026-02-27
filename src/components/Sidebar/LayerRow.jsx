import { useMemo, useState } from 'react'
import { CATEGORY_PRESETS, TRANSPORT_PRESETS, TRAVEL_PIN_ICON_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'

function LayerRow({ layer, filteredPins, measurements, isDraggingLayer, layerDropPreview, onLayerDragStart, onLayerDragEnd, onLayerDragOver, onLayerDrop }) {
  const activeLayerId = useProjectStore((state) => state.activeLayerId)
  const setActiveLayer = useProjectStore((state) => state.setActiveLayer)
  const toggleLayerVisibility = useProjectStore((state) => state.toggleLayerVisibility)
  const toggleLayerCollapse = useProjectStore((state) => state.toggleLayerCollapse)
  const renameLayer = useProjectStore((state) => state.renameLayer)
  const removeLayer = useProjectStore((state) => state.removeLayer)
  const selectPin = useProjectStore((state) => state.selectPin)
  const updatePin = useProjectStore((state) => state.updatePin)
  const removePin = useProjectStore((state) => state.removePin)
  const reorderPinsInLayer = useProjectStore((state) => state.reorderPinsInLayer)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pinOptionsPinId, setPinOptionsPinId] = useState(null)
  const [iconPickerPinId, setIconPickerPinId] = useState(null)
  const [dragPinId, setDragPinId] = useState(null)
  const [pinDropPreview, setPinDropPreview] = useState(null)

  const layerPins = useMemo(() => filteredPins.filter((pinItem) => pinItem.layerId === layer.id), [filteredPins, layer.id])
  const layerMeasurements = useMemo(() => measurements.filter((measurementItem) => measurementItem.layerId === layer.id), [measurements, layer.id])
  const isActiveLayer = activeLayerId === layer.id
  const isLayerDropPreviewBefore = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'before'
  const isLayerDropPreviewAfter = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'after'

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
      className={`border-b py-2 last:border-b-0 ${isActiveLayer ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200'} ${
        isDraggingLayer ? 'opacity-60' : ''
      }`}
      draggable
      onDragStart={(event) => {
        event.stopPropagation()
        onLayerDragStart(layer.id)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const targetRect = event.currentTarget.getBoundingClientRect()
        const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
        onLayerDragOver(layer.id, isUpperHalf ? 'before' : 'after')
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const targetRect = event.currentTarget.getBoundingClientRect()
        const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
        onLayerDrop(layer.id, isUpperHalf ? 'before' : 'after')
      }}
      onDragEnd={() => onLayerDragEnd()}
      onClick={() => {
        if (pinOptionsPinId) {
          setPinOptionsPinId(null)
        }
        if (iconPickerPinId) {
          setIconPickerPinId(null)
        }
      }}
    >
      {isLayerDropPreviewBefore && <div className="mx-2 mb-1 h-1 rounded bg-blue-500" />}
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
              <div
                key={pinItem.id}
                className="space-y-1"
                draggable
                onDragStart={(event) => {
                  event.stopPropagation()
                  setDragPinId(pinItem.id)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const targetRect = event.currentTarget.getBoundingClientRect()
                  const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
                  setPinDropPreview({ targetPinId: pinItem.id, dropPosition: isUpperHalf ? 'before' : 'after' })
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!dragPinId) return
                  const targetRect = event.currentTarget.getBoundingClientRect()
                  const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
                  reorderPinsInLayer(layer.id, dragPinId, pinItem.id, isUpperHalf ? 'before' : 'after')
                  setDragPinId(null)
                  setPinDropPreview(null)
                }}
                onDragEnd={() => {
                  setDragPinId(null)
                  setPinDropPreview(null)
                }}
              >
                {pinDropPreview?.targetPinId === pinItem.id && pinDropPreview.dropPosition === 'before' && (
                  <div className="mx-2 h-1 rounded bg-blue-500" />
                )}
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => selectPin(pinItem.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                    <span
                      className="relative"
                      onClick={(event) => {
                        event.stopPropagation()
                        setIconPickerPinId((previousPinId) => (previousPinId === pinItem.id ? null : pinItem.id))
                      }}
                    >
                      <button
                        type="button"
                        className="rounded px-1 text-base hover:bg-gray-200"
                        title="아이콘 변경"
                        aria-label="아이콘 변경"
                      >
                        {pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon}
                      </button>
                      {iconPickerPinId === pinItem.id ? (
                        <div
                          className="absolute left-0 top-7 z-30 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="grid grid-cols-5 gap-1">
                            {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => {
                              const isSelectedIcon = (pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon) === iconPreset.icon
                              return (
                                <button
                                  key={iconPreset.key}
                                  type="button"
                                  onClick={() => {
                                    updatePin(pinItem.id, { icon: iconPreset.icon })
                                    setIconPickerPinId(null)
                                  }}
                                  className={`rounded-md px-1 py-1 text-lg hover:bg-gray-100 ${isSelectedIcon ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
                                  title={iconPreset.label}
                                  aria-label={iconPreset.label}
                                >
                                  {iconPreset.icon}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </span>
                    <span className="truncate">{pinItem.name}</span>
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setPinOptionsPinId((previousPinId) => (previousPinId === pinItem.id ? null : pinItem.id))
                      }}
                      className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                      aria-label="핀 옵션"
                    >
                      ⋯
                    </button>
                    {pinOptionsPinId === pinItem.id && (
                      <div className="absolute right-0 top-8 z-30 min-w-28 rounded border border-gray-200 bg-white py-1 shadow">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            const nextPinName = window.prompt('핀 이름 변경', pinItem.name)
                            if (nextPinName?.trim()) {
                              updatePin(pinItem.id, { name: nextPinName.trim() })
                            }
                            setPinOptionsPinId(null)
                          }}
                          className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          이름 변경
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            removePin(pinItem.id)
                            setPinOptionsPinId(null)
                          }}
                          className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100"
                        >
                          핀 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {routeItem && (
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                    <span>{TRANSPORT_PRESETS[routeItem.transport]?.icon ?? TRANSPORT_PRESETS.walk.icon}</span>
                    <span className="truncate">
                      {pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}
                    </span>
                  </div>
                )}
                {pinDropPreview?.targetPinId === pinItem.id && pinDropPreview.dropPosition === 'after' && (
                  <div className="mx-2 h-1 rounded bg-blue-500" />
                )}
              </div>
            )
          })}

          {!!layerMeasurements.length && (
            <div className="mt-2 space-y-1 px-2">
              {layerMeasurements.map((measurementItem, measurementIndex) => (
                <div key={measurementItem.id} className="flex items-center gap-2 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700">
                  <span>📏</span>
                  <span className="truncate">거리 측정 {measurementIndex + 1}</span>
                  <span className="ml-auto text-[11px] text-orange-500">{measurementItem.points.length}점</span>
                </div>
              ))}
            </div>
          )}

          {!!layerPins.length && (
            <div
              className={`mx-2 h-1 rounded bg-blue-500 transition-opacity ${pinDropPreview?.targetPinId === '__end__' ? 'opacity-100' : 'opacity-0'}`}
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!dragPinId) return
                setPinDropPreview({ targetPinId: '__end__', dropPosition: 'end' })
              }}
              onDrop={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!dragPinId || !layerPins.length) return
                reorderPinsInLayer(layer.id, dragPinId, layerPins[layerPins.length - 1].id, 'end')
                setDragPinId(null)
                setPinDropPreview(null)
              }}
            />
          )}
        </div>
      )}
      {isLayerDropPreviewAfter && <div className="mx-2 mt-1 h-1 rounded bg-blue-500" />}
    </div>
  )
}

export default LayerRow
