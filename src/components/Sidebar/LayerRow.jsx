import React, { Component, createRef } from 'react'
import {
  CATEGORY_PRESETS,
  DEFAULT_PIN_SVG_PATH,
  TRANSPORT_PRESETS,
  TRAVEL_PIN_ICON_PRESETS,
  getTravelPinIconKey,
  getTravelPinIconPreset,
} from '../../utils/opts'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'

class LayerRow extends Component {
  constructor(props) {
    super(props)
    this.layerRenameInputRef = createRef()
    this.pinRenameInputRefsById = {}
    this.state = {
      isMenuOpen: false,
      pinOptionsPinId: null,
      iconPickerPinId: null,
      dragPinId: null,
      pinDropPreview: null,
      layerRenameDraft: props.layer.name,
      pinRenameDraftsById: {},
    }
  }

  componentDidMount() {
    this.syncPinRenameDrafts(this.props)
  }

  componentDidUpdate(previousProps) {
    if (previousProps.layer.name !== this.props.layer.name) {
      this.setState({ layerRenameDraft: this.props.layer.name })
    }

    if (previousProps.filteredPins !== this.props.filteredPins || previousProps.layer.id !== this.props.layer.id) {
      this.syncPinRenameDrafts(this.props)
    }

    const layerRenameTargetId = `layer:${this.props.layer.id}`
    const isLayerNameEditing = this.props.editingRenameTarget?.id === layerRenameTargetId
    const wasLayerNameEditing = previousProps.editingRenameTarget?.id === layerRenameTargetId
    if (isLayerNameEditing && !wasLayerNameEditing) {
      this.layerRenameInputRef.current?.focus()
      this.layerRenameInputRef.current?.select()
    }

    const editingPinId = this.props.editingRenameTarget?.type === 'pin' ? this.props.editingRenameTarget.pinId : null
    const previousEditingPinId = previousProps.editingRenameTarget?.type === 'pin' ? previousProps.editingRenameTarget.pinId : null
    if (editingPinId && editingPinId !== previousEditingPinId && this.props.editingRenameTarget?.layerId === this.props.layer.id) {
      const pinInputElement = this.pinRenameInputRefsById[editingPinId]
      pinInputElement?.focus()
      pinInputElement?.select()
    }
  }

  getStore() {
    return this.props.projectStore
  }

  getLayerPins() {
    const { filteredPins, layer } = this.props
    return filteredPins.filter((pinItem) => pinItem.layerId === layer.id)
  }

  getLayerLines() {
    const { lines, layer } = this.props
    return lines.filter((lineItem) => lineItem.layerId === layer.id)
  }

  syncPinRenameDrafts(currentProps) {
    const layerPins = currentProps.filteredPins.filter((pinItem) => pinItem.layerId === currentProps.layer.id)
    this.setState((previousState) => {
      const nextDraftMap = {}
      layerPins.forEach((pinItem) => {
        nextDraftMap[pinItem.id] = previousState.pinRenameDraftsById[pinItem.id] ?? pinItem.name
      })
      return { pinRenameDraftsById: nextDraftMap }
    })
  }

  commitLayerRename = () => {
    const { layer, onFinishRename } = this.props
    const nextLayerName = this.state.layerRenameDraft.trim()
    if (nextLayerName) {
      this.getStore().renameLayer(layer.id, nextLayerName)
    }
    onFinishRename()
  }

  cancelLayerRename = () => {
    this.setState({ layerRenameDraft: this.props.layer.name })
    this.props.onFinishRename()
  }

  commitPinRename = (pinItem) => {
    const nextPinName = (this.state.pinRenameDraftsById[pinItem.id] ?? pinItem.name).trim()
    if (nextPinName) {
      this.getStore().updatePin(pinItem.id, { name: nextPinName })
      this.setState((previousState) => ({ pinRenameDraftsById: { ...previousState.pinRenameDraftsById, [pinItem.id]: nextPinName } }))
    }
    this.props.onFinishRename()
  }

  cancelPinRename = (pinItem) => {
    this.setState((previousState) => ({ pinRenameDraftsById: { ...previousState.pinRenameDraftsById, [pinItem.id]: pinItem.name } }))
    this.props.onFinishRename()
  }

  render() {
    const {
      layer,
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
    } = this.props

    const {
      activeLayerId,
      setActiveLayer,
      toggleLayerVisibility,
      toggleLayerCollapse,
      removeLayer,
      selectPin,
      removePin,
      reorderPinsInLayer,
      updatePin,
    } = this.getStore()

    const layerPins = this.getLayerPins()
    const layerLines = this.getLayerLines()
    const layerMeasurementLines = layerLines.filter((lineItem) => lineItem.sourceType === 'measurement')
    const layerDrawnLines = layerLines.filter((lineItem) => lineItem.sourceType !== 'measurement')
    const pinNameMap = layerPins.reduce((nameMap, pinItem) => {
      nameMap[pinItem.id] = pinItem.name
      return nameMap
    }, {})

    const isActiveLayer = activeLayerId === layer.id
    const isLayerDropPreviewBefore = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'before'
    const isLayerDropPreviewAfter = layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'after'

    return (
      <div
        className={`border-b py-2 last:border-b-0 ${isActiveLayer ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200'} ${isDraggingLayer ? 'opacity-60' : ''}`}
        draggable
        onDragStart={(event) => {
          event.stopPropagation()
          onLayerDragStart(layer.id)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()
          const targetRect = event.currentTarget.getBoundingClientRect()
          onLayerDragOver(layer.id, event.clientY < targetRect.top + targetRect.height / 2 ? 'before' : 'after')
        }}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          const targetRect = event.currentTarget.getBoundingClientRect()
          onLayerDrop(layer.id, event.clientY < targetRect.top + targetRect.height / 2 ? 'before' : 'after')
        }}
        onDragEnd={() => onLayerDragEnd()}
        onClick={() => {
          this.setState({ pinOptionsPinId: null, iconPickerPinId: null })
          setActiveLayer(layer.id)
        }}
      >
        {isLayerDropPreviewBefore ? <div className="mx-2 mb-1 h-1 rounded bg-blue-500" /> : null}

        <div className="flex items-center gap-2 px-2">
          <button type="button" onClick={(event) => {
            event.stopPropagation()
            toggleLayerCollapse(layer.id)
          }} className="text-sm text-gray-500">{layer.collapsed ? '▶' : '▼'}</button>
          <input type="checkbox" checked={layer.visible} onChange={(event) => {
            event.stopPropagation()
            toggleLayerVisibility(layer.id)
          }} />

          {editingRenameTarget?.id === `layer:${layer.id}` ? (
            <input
              ref={this.layerRenameInputRef}
              value={this.state.layerRenameDraft}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => this.setState({ layerRenameDraft: event.target.value })}
              onBlur={this.commitLayerRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') this.commitLayerRename()
                if (event.key === 'Escape') this.cancelLayerRename()
              }}
              className="flex-1 rounded border border-blue-300 px-2 py-0.5 text-sm"
            />
          ) : (
            <button type="button" onClick={(event) => {
              event.stopPropagation()
              setActiveLayer(layer.id)
            }} onDoubleClick={() => onStartRename({ type: 'layer', id: `layer:${layer.id}`, layerId: layer.id })} onFocus={() => onFocusRenameTarget({ type: 'layer', id: `layer:${layer.id}`, layerId: layer.id })} className={`min-w-0 flex-1 truncate text-left text-sm ${focusedRenameTarget?.id === `layer:${layer.id}` ? 'underline underline-offset-2' : ''}`}>
              {layer.name}
            </button>
          )}

          <div className="relative">
            <button type="button" onClick={(event) => {
              event.stopPropagation()
              this.setState((previousState) => ({ isMenuOpen: !previousState.isMenuOpen }))
            }} className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">⋯</button>
            {this.state.isMenuOpen ? (
              <div className="absolute right-0 top-8 z-30 min-w-28 rounded border border-gray-200 bg-white py-1 shadow">
                <button type="button" onClick={() => {
                  onStartRename({ type: 'layer', id: `layer:${layer.id}`, layerId: layer.id })
                  this.setState({ isMenuOpen: false })
                }} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100">이름 변경</button>
                <button type="button" onClick={() => {
                  removeLayer(layer.id)
                  this.setState({ isMenuOpen: false })
                }} className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100">레이어 삭제</button>
              </div>
            ) : null}
          </div>
        </div>

        {!layer.collapsed ? (
          <div className="mt-2 space-y-1">
            {layerPins.map((pinItem) => {
              const routeItem = layer.routes?.find((route) => route.fromPinId === pinItem.id || route.toPinId === pinItem.id)
              return (
                <div key={pinItem.id} className="px-2">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => selectPin(pinItem.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                      <span className="relative" onClick={(event) => {
                        event.stopPropagation()
                        this.setState((previousState) => ({ iconPickerPinId: previousState.iconPickerPinId === pinItem.id ? null : pinItem.id }))
                      }}>
                        <button type="button" className="rounded px-1 text-base hover:bg-gray-200" title="아이콘 변경" aria-label="아이콘 변경">
                          {(() => {
                            const currentIconPreset = getTravelPinIconPreset(pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon)
                            return <img src={currentIconPreset?.svgPath || DEFAULT_PIN_SVG_PATH} alt={currentIconPreset?.label || '기본 아이콘'} className="h-5 w-5" />
                          })()}
                        </button>
                        {this.state.iconPickerPinId === pinItem.id ? (
                          <div className="absolute left-0 top-7 z-30 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xl" onClick={(event) => event.stopPropagation()}>
                            <div className="grid grid-cols-5 gap-1">
                              {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => {
                                const isSelectedIcon = getTravelPinIconKey(pinItem.icon || CATEGORY_PRESETS[pinItem.category]?.icon || CATEGORY_PRESETS.default.icon) === iconPreset.key
                                return (
                                  <button key={iconPreset.key} type="button" onClick={() => {
                                    updatePin(pinItem.id, { icon: iconPreset.key })
                                    this.setState({ iconPickerPinId: null })
                                  }} className={`rounded-md px-1 py-1 text-lg hover:bg-gray-100 ${isSelectedIcon ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`} title={iconPreset.label}>
                                    <img src={iconPreset.svgPath} alt={iconPreset.label} className="h-5 w-5" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </span>

                      {editingRenameTarget?.id === `pin:${pinItem.id}` ? (
                        <input
                          ref={(inputElement) => { this.pinRenameInputRefsById[pinItem.id] = inputElement }}
                          type="text"
                          value={this.state.pinRenameDraftsById[pinItem.id] ?? pinItem.name}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const nextPinNameDraft = event.target.value
                            this.setState((previousState) => ({ pinRenameDraftsById: { ...previousState.pinRenameDraftsById, [pinItem.id]: nextPinNameDraft } }))
                          }}
                          onBlur={() => this.commitPinRename(pinItem)}
                          onKeyDown={(event) => {
                            event.stopPropagation()
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              this.commitPinRename(pinItem)
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              this.cancelPinRename(pinItem)
                            }
                          }}
                          className="w-full rounded border border-blue-300 bg-white px-2 py-0.5 text-sm"
                        />
                      ) : (
                        <span className={`truncate ${focusedRenameTarget?.id === `pin:${pinItem.id}` ? 'underline underline-offset-2' : ''}`} onDoubleClick={() => onStartRename({ type: 'pin', id: `pin:${pinItem.id}`, layerId: layer.id, pinId: pinItem.id })}>
                          {pinItem.name}
                        </span>
                      )}
                    </button>

                    <div className="relative">
                      <button type="button" onClick={(event) => {
                        event.stopPropagation()
                        this.setState((previousState) => ({ pinOptionsPinId: previousState.pinOptionsPinId === pinItem.id ? null : pinItem.id }))
                      }} className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">⋯</button>
                      {this.state.pinOptionsPinId === pinItem.id ? (
                        <div className="absolute right-0 top-8 z-30 min-w-28 rounded border border-gray-200 bg-white py-1 shadow">
                          <button type="button" onClick={(event) => {
                            event.stopPropagation()
                            onStartRename({ type: 'pin', id: `pin:${pinItem.id}`, layerId: layer.id, pinId: pinItem.id })
                            this.setState({ pinOptionsPinId: null })
                          }} className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100">이름 변경</button>
                          <button type="button" onClick={(event) => {
                            event.stopPropagation()
                            removePin(pinItem.id)
                            this.setState({ pinOptionsPinId: null })
                          }} className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100">핀 삭제</button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {routeItem ? (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                      <span>{TRANSPORT_PRESETS[routeItem.transport]?.icon ?? TRANSPORT_PRESETS.walk.icon}</span>
                      <span className="truncate">{pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}

            {!!layerDrawnLines.length ? (
              <div className="mt-2 space-y-1 px-2">
                {layerDrawnLines.map((lineItem, lineIndex) => (
                  <div key={lineItem.id} className="flex items-center gap-2 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700">
                    <span>🧵</span>
                    <span className="truncate">{lineItem.shapeType === 'polygon' ? `도형 ${lineIndex + 1}` : `선분 ${lineIndex + 1}`}</span>
                    <span className="ml-auto text-[11px] text-orange-500">{lineItem.points.length}점</span>
                  </div>
                ))}
              </div>
            ) : null}

            {!!layerMeasurementLines.length ? (
              <div className="mt-2 space-y-1 px-2">
                {layerMeasurementLines.map((lineItem, lineIndex) => (
                  <div key={lineItem.id} className="flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    <span>📏</span>
                    <span className="truncate">측정 {lineIndex + 1}</span>
                    <span className="ml-auto text-[11px] text-blue-500">{lineItem.points.length}점</span>
                  </div>
                ))}
              </div>
            ) : null}

            {!!layerPins.length ? (
              <div className={`mx-2 h-1 rounded bg-blue-500 transition-opacity ${this.state.pinDropPreview?.targetPinId === '__end__' ? 'opacity-100' : 'opacity-0'}`} onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!this.state.dragPinId) return
                this.setState({ pinDropPreview: { targetPinId: '__end__', dropPosition: 'end' } })
              }} onDrop={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!this.state.dragPinId || !layerPins.length) return
                reorderPinsInLayer(layer.id, this.state.dragPinId, layerPins[layerPins.length - 1].id, 'end')
                this.setState({ dragPinId: null, pinDropPreview: null })
              }} />
            ) : null}
          </div>
        ) : null}

        {isLayerDropPreviewAfter ? <div className="mx-2 mt-1 h-1 rounded bg-blue-500" /> : null}
      </div>
    )
  }
}

export default withStore(LayerRow, { projectStore: useProjectStore })
