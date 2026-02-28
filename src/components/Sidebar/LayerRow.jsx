import React from 'react'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'
import { CATEGORY_PRESETS, DEFAULT_PIN_SVG_PATH, TRANSPORT_PRESETS, TRAVEL_PIN_ICON_PRESETS, getTravelPinIconKey, getTravelPinIconPreset } from '../../utils/opts'

class LayerRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isMenuOpen: false,
      pinOptionsPinId: null,
      iconPickerPinId: null,
      dragPinId: null,
      pinDropPreview: null,
      layerRenameDraft: props.layer.name,
      pinRenameDraftsById: {},
    }
    this.layerRenameInputRef = React.createRef()
    this.pinRenameInputRefsById = {}
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousProps.layer.name !== this.props.layer.name) {
      this.setState({ layerRenameDraft: this.props.layer.name })
    }

    const currentEditingTarget = this.props.editingRenameTarget
    const previousEditingTarget = previousProps.editingRenameTarget
    if (currentEditingTarget !== previousEditingTarget) {
      if (currentEditingTarget?.type === 'layer' && currentEditingTarget.id === `layer-${this.props.layer.id}`) {
        window.setTimeout(() => this.layerRenameInputRef.current?.focus(), 0)
      }
      if (currentEditingTarget?.type === 'pin' && currentEditingTarget.layerId === this.props.layer.id) {
        window.setTimeout(() => this.pinRenameInputRefsById[currentEditingTarget.id]?.focus?.(), 0)
      }
    }

    if (previousState.pinOptionsPinId !== this.state.pinOptionsPinId && this.state.pinOptionsPinId) {
      window.addEventListener('click', this.handleOutsidePinOptionsClick)
    }
    if (previousState.pinOptionsPinId && !this.state.pinOptionsPinId) {
      window.removeEventListener('click', this.handleOutsidePinOptionsClick)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleOutsidePinOptionsClick)
  }

  handleOutsidePinOptionsClick = () => {
    this.setState({ pinOptionsPinId: null })
  }

  render() {
    const {
      layer,
      filteredPins,
      lines,
      isDraggingLayer,
      layerDropPreview,
      onLayerDragStart,
      onLayerDragEnd,
      onLayerDragOver,
      onLayerDrop,
      focusedRenameTarget,
      editingRenameTarget,
      onFocusRenameTarget,
      onStartRename,
      onFinishRename,
      projectStore,
    } = this.props

    const {
      isMenuOpen,
      pinOptionsPinId,
      iconPickerPinId,
      dragPinId,
      pinDropPreview,
      layerRenameDraft,
      pinRenameDraftsById,
    } = this.state

    const layerPins = filteredPins.filter((pinItem) => pinItem.layerId === layer.id)
    const layerLines = lines.filter((lineItem) => lineItem.layerId === layer.id)
    const layerMeasurementLines = layerLines.filter((lineItem) => lineItem.sourceType === 'measurement')
    const layerDrawnLines = layerLines.filter((lineItem) => lineItem.sourceType !== 'measurement')
    const layerRenameTargetId = `layer-${layer.id}`
    const isLayerRenameEditing = editingRenameTarget?.id === layerRenameTargetId
    const isLayerFocused = focusedRenameTarget?.id === layerRenameTargetId
    const isLayerDropPreviewBefore = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'before'
    const isLayerDropPreviewAfter = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'after'
    const pinNameMap = layerPins.reduce((accumulator, pinItem) => ({ ...accumulator, [pinItem.id]: pinItem.name }), {})

    return (
      <div
        className={`rounded-md border px-2 py-2 ${isDraggingLayer ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          onLayerDragStart(layer.id)
        }}
        onDragEnd={onLayerDragEnd}
        onDragOver={(event) => {
          event.preventDefault()
          const targetRect = event.currentTarget.getBoundingClientRect()
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
          onLayerDragOver(layer.id, isUpperHalf ? 'before' : 'after')
        }}
        onDrop={(event) => {
          event.preventDefault()
          const targetRect = event.currentTarget.getBoundingClientRect()
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
          onLayerDrop(layer.id, isUpperHalf ? 'before' : 'after')
        }}
      >
        {isLayerDropPreviewBefore && <div className="mx-2 mb-1 h-1 rounded bg-blue-500" />}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => projectStore.toggleLayerCollapse(layer.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100">{layer.collapsed ? '▶' : '▼'}</button>
          <input type="checkbox" checked={layer.visible} onChange={() => projectStore.toggleLayerVisibility(layer.id)} />

          <button type="button" onClick={() => projectStore.setActiveLayer(layer.id)} className={`min-w-0 flex-1 rounded px-1 py-1 text-left text-sm ${projectStore.activeLayerId === layer.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            {isLayerRenameEditing ? (
              <input
                ref={this.layerRenameInputRef}
                value={layerRenameDraft}
                onChange={(event) => this.setState({ layerRenameDraft: event.target.value })}
                onBlur={() => {
                  projectStore.renameLayer(layer.id, layerRenameDraft || layer.name)
                  onFinishRename()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    projectStore.renameLayer(layer.id, layerRenameDraft || layer.name)
                    onFinishRename()
                  }
                  if (event.key === 'Escape') {
                    this.setState({ layerRenameDraft: layer.name })
                    onFinishRename()
                  }
                }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            ) : (
              <span
                tabIndex={0}
                className={`${isLayerFocused ? 'ring-2 ring-blue-200' : ''} rounded px-1`}
                onFocus={() => onFocusRenameTarget({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })}
                onClick={() => onFocusRenameTarget({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onStartRename({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })
                }}
              >
                {layer.name}
              </span>
            )}
          </button>

          <div className="relative">
            <button type="button" onClick={() => this.setState((previousState) => ({ isMenuOpen: !previousState.isMenuOpen }))} className="rounded p-1 text-gray-500 hover:bg-gray-100">⋮</button>
            {isMenuOpen && (
              <div className="absolute right-0 top-7 z-10 w-24 rounded border border-gray-200 bg-white py-1 shadow">
                <button
                  type="button"
                  onClick={() => {
                    onStartRename({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })
                    this.setState({ isMenuOpen: false })
                  }}
                  className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  이름 변경
                </button>
                <button type="button" onClick={() => projectStore.removeLayer(layer.id)} className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100">삭제</button>
              </div>
            )}
          </div>
        </div>

        {!layer.collapsed && (
          <div className="relative mt-2 space-y-1 pl-8 pr-2">
            {layerPins.map((pinItem, pinIndex) => {
              const nextPin = layerPins[pinIndex + 1]
              const routeItem = layer.routes.find((routeData) => routeData.fromPinId === pinItem.id && routeData.toPinId === nextPin?.id)
              const pinRenameTargetId = `pin-${pinItem.id}`
              const isPinRenameEditing = editingRenameTarget?.id === pinRenameTargetId

              return (
                <div
                  key={pinItem.id}
                  className="space-y-1"
                  draggable
                  onDragStart={(event) => {
                    event.stopPropagation()
                    this.setState({ dragPinId: pinItem.id })
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const targetRect = event.currentTarget.getBoundingClientRect()
                    const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
                    this.setState({ pinDropPreview: { targetPinId: pinItem.id, dropPosition: isUpperHalf ? 'before' : 'after' } })
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (!dragPinId) return
                    const targetRect = event.currentTarget.getBoundingClientRect()
                    const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2
                    projectStore.reorderPinsInLayer(layer.id, dragPinId, pinItem.id, isUpperHalf ? 'before' : 'after')
                    this.setState({ dragPinId: null, pinDropPreview: null })
                  }}
                  onDragEnd={() => this.setState({ dragPinId: null, pinDropPreview: null })}
                >
                  {pinDropPreview?.targetPinId === pinItem.id && pinDropPreview.dropPosition === 'before' && <div className="mx-2 h-1 rounded bg-blue-500" />}

                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => projectStore.selectPin(pinItem.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                      <span className="relative" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="rounded px-1 text-base hover:bg-gray-200"
                          onClick={() => this.setState((previousState) => ({ iconPickerPinId: previousState.iconPickerPinId === pinItem.id ? null : pinItem.id }))}
                        >
                          {(() => {
                            const currentIconPreset = getTravelPinIconPreset(pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon)
                            return <img src={currentIconPreset?.svgPath || DEFAULT_PIN_SVG_PATH} alt={currentIconPreset?.label || '기본 아이콘'} className="h-5 w-5" />
                          })()}
                        </button>
                        {iconPickerPinId === pinItem.id ? (
                          <div className="absolute left-0 top-7 z-30 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xl" onClick={(event) => event.stopPropagation()}>
                            <div className="grid grid-cols-5 gap-1">
                              {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => {
                                const isSelectedIcon = getTravelPinIconKey(pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon) === iconPreset.key
                                return (
                                  <button
                                    key={iconPreset.key}
                                    type="button"
                                    onClick={() => {
                                      projectStore.updatePin(pinItem.id, { icon: iconPreset.key })
                                      this.setState({ iconPickerPinId: null })
                                    }}
                                    className={`rounded-md px-1 py-1 text-lg hover:bg-gray-100 ${isSelectedIcon ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
                                  >
                                    <img src={iconPreset.svgPath} alt={iconPreset.label} className="h-5 w-5" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </span>

                      {isPinRenameEditing ? (
                        <input
                          ref={(node) => {
                            this.pinRenameInputRefsById[pinRenameTargetId] = node
                          }}
                          value={pinRenameDraftsById[pinItem.id] ?? pinItem.name}
                          onChange={(event) => {
                            const nextPinRenameDraft = event.target.value
                            this.setState((previousState) => ({
                              pinRenameDraftsById: { ...previousState.pinRenameDraftsById, [pinItem.id]: nextPinRenameDraft },
                            }))
                          }}
                          onBlur={() => {
                            projectStore.updatePin(pinItem.id, { name: pinRenameDraftsById[pinItem.id] ?? pinItem.name })
                            onFinishRename()
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              projectStore.updatePin(pinItem.id, { name: pinRenameDraftsById[pinItem.id] ?? pinItem.name })
                              onFinishRename()
                            }
                            if (event.key === 'Escape') {
                              onFinishRename()
                            }
                          }}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        <span
                          className="truncate"
                          tabIndex={0}
                          onFocus={() => onFocusRenameTarget({ type: 'pin', id: pinRenameTargetId, layerId: layer.id })}
                          onDoubleClick={(event) => {
                            event.stopPropagation()
                            onStartRename({ type: 'pin', id: pinRenameTargetId, layerId: layer.id })
                          }}
                        >
                          {pinItem.name}
                        </span>
                      )}
                    </button>

                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-100" onClick={() => this.setState({ pinOptionsPinId: pinOptionsPinId === pinItem.id ? null : pinItem.id })}>⋯</button>
                      {pinOptionsPinId === pinItem.id && (
                        <div className="absolute right-0 top-7 z-20 w-28 rounded border border-gray-200 bg-white py-1 shadow">
                          <button
                            type="button"
                            onClick={() => {
                              onStartRename({ type: 'pin', id: pinRenameTargetId, layerId: layer.id })
                              this.setState({ pinOptionsPinId: null })
                            }}
                            className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-100"
                          >
                            이름 변경
                          </button>
                          <button type="button" onClick={() => projectStore.removePin(pinItem.id)} className="block w-full px-3 py-1 text-left text-xs text-red-500 hover:bg-gray-100">핀 삭제</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {routeItem && (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                      <span>{TRANSPORT_PRESETS[routeItem.transport]?.icon ?? TRANSPORT_PRESETS.walk.icon}</span>
                      <span className="truncate">{pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}</span>
                    </div>
                  )}
                  {pinDropPreview?.targetPinId === pinItem.id && pinDropPreview.dropPosition === 'after' && <div className="mx-2 h-1 rounded bg-blue-500" />}
                </div>
              )
            })}

            {!!layerLines.length && (
              <div className="mt-2 space-y-2 px-2">
                {!!layerDrawnLines.length && (
                  <div className="space-y-1">
                    {layerDrawnLines.map((lineItem, lineIndex) => (
                      <div key={lineItem.id} className="flex items-center gap-2 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700">
                        <span>🧵</span>
                        <span className="truncate">{lineItem.shapeType === 'polygon' ? `도형 ${lineIndex + 1}` : `선분 ${lineIndex + 1}`}</span>
                        <span className="ml-auto text-[11px] text-orange-500">{lineItem.points.length}점</span>
                      </div>
                    ))}
                  </div>
                )}

                {!!layerMeasurementLines.length && (
                  <div className="space-y-1">
                    {layerMeasurementLines.map((lineItem, lineIndex) => (
                      <div key={lineItem.id} className="flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        <span>📏</span>
                        <span className="truncate">측정 {lineIndex + 1}</span>
                        <span className="ml-auto text-[11px] text-blue-500">{lineItem.points.length}점</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!!layerPins.length && (
              <div
                className={`mx-2 h-1 rounded bg-blue-500 transition-opacity ${pinDropPreview?.targetPinId === '__end__' ? 'opacity-100' : 'opacity-0'}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!dragPinId) return
                  this.setState({ pinDropPreview: { targetPinId: '__end__', dropPosition: 'end' } })
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!dragPinId || !layerPins.length) return
                  projectStore.reorderPinsInLayer(layer.id, dragPinId, layerPins[layerPins.length - 1].id, 'end')
                  this.setState({ dragPinId: null, pinDropPreview: null })
                }}
              />
            )}
          </div>
        )}
        {isLayerDropPreviewAfter && <div className="mx-2 mt-1 h-1 rounded bg-blue-500" />}
      </div>
    )
  }
}

const ConnectedLayerRow = withStore(LayerRow, { projectStore: useProjectStore })

export default ConnectedLayerRow
