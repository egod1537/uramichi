import React, { Component, createRef } from 'react'
import { OverlayView } from '@react-google-maps/api'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'
import { CATEGORY_PRESETS, DEFAULT_PIN_SVG_PATH, PIN_MARKER_COLOR_PRESETS, TRAVEL_PIN_ICON_PRESETS, getTravelPinIconKey, getTravelPinIconPreset } from '../../utils/opts'
import { convertFileToDataUrl } from '../../utils/file'
import TimelineBar from './TimelineBar'

const overlayPane = OverlayView.OVERLAY_MOUSE_TARGET

const categoryOptionList = [
  { key: 'default', label: '일반' },
  { key: 'airport', label: '공항' },
  { key: 'station', label: '기차역' },
  { key: 'cafe', label: '카페' },
  { key: 'food', label: '맛집' },
  { key: 'photo', label: '포토스팟' },
  { key: 'shopping', label: '쇼핑' },
]

const stayDurationOptionList = ['30분', '1시간', '1.5시간', '2시간', '3시간', '직접입력']
const colorPresetList = Object.values(PIN_MARKER_COLOR_PRESETS).slice(0, 8).map((colorPreset) => colorPreset.backgroundColor)

class PinPopup extends Component {
  constructor(props) {
    super(props)
    const { pin } = props
    this.popupContainerRef = createRef()
    this.imageInputRef = createRef()
    this.state = {
      isEditMode: false,
      isIconPickerOpen: false,
      isOpeningHoursEditorOpen: false,
      isNameEditing: false,
      tagDraftInput: '',
      editDraft: this.createEditDraft(pin),
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleEscapeKeyDown)
  }

  componentDidUpdate(previousProps) {
    if (previousProps.pin.id !== this.props.pin.id) {
      this.setState({
        isEditMode: false,
        isIconPickerOpen: false,
        isOpeningHoursEditorOpen: false,
        isNameEditing: false,
        tagDraftInput: '',
        editDraft: this.createEditDraft(this.props.pin),
      })
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleEscapeKeyDown)
  }

  createEditDraft(pin) {
    return {
      name: pin.name || '',
      memo: pin.memo || '',
      category: pin.category || 'default',
      tags: pin.tags || [],
      stayDuration: pin.stayDuration || '1시간',
      stayDurationCustom: pin.stayDurationCustom || '',
      cost: pin.cost || '',
      color: pin.color || '',
    }
  }

  getStore() {
    return this.props.projectStore
  }

  handleOutsideClick = (event) => {
    if (!this.popupContainerRef.current?.contains(event.target)) {
      this.getStore().selectPin(null)
    }
  }

  handleEscapeKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.getStore().selectPin(null)
    }
  }

  handleNameCommit = () => {
    const { pin } = this.props
    const { updatePin } = this.getStore()
    const trimmedName = this.state.editDraft.name.trim()
    const nextName = trimmedName || pin.name || ''
    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, name: nextName }, isNameEditing: false }))
    if (nextName !== pin.name) {
      updatePin(pin.id, { name: nextName })
    }
  }

  handleDeletePin = () => {
    const { pin } = this.props
    this.getStore().removePin(pin.id)
  }

  handleAddTag = () => {
    const { pin } = this.props
    const { updatePin } = this.getStore()
    const trimmedTag = this.state.tagDraftInput.trim()
    if (!trimmedTag) return
    if (this.state.editDraft.tags.includes(trimmedTag)) {
      this.setState({ tagDraftInput: '' })
      return
    }
    const nextTags = [...this.state.editDraft.tags, trimmedTag]
    this.setState((previousState) => ({
      tagDraftInput: '',
      editDraft: { ...previousState.editDraft, tags: nextTags },
    }))
    updatePin(pin.id, { tags: nextTags })
  }

  handleImageChange = async (event) => {
    const { pin } = this.props
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    const imageDataUrl = await convertFileToDataUrl(selectedFile)
    this.getStore().updatePin(pin.id, { images: [...(pin.images || []), imageDataUrl] })
    event.target.value = ''
  }

  render() {
    const { pin } = this.props
    const { selectedPinId, updatePin, selectPin } = this.getStore()
    if (!selectedPinId || selectedPinId !== pin.id) return null

    const categoryPreset = CATEGORY_PRESETS[pin.category] || CATEGORY_PRESETS.default
    const currentPinIconKey = getTravelPinIconKey(pin.icon || categoryPreset.icon)
    const currentPinIconPreset = getTravelPinIconPreset(currentPinIconKey)
    const openingHoursRangeList = Array.isArray(pin.openingHours) ? pin.openingHours : []
    const isCustomStayDuration = this.state.editDraft.stayDuration === '' || Boolean(this.state.editDraft.stayDurationCustom)

    return (
      <OverlayView position={pin.position} mapPaneName={overlayPane}>
        <div ref={this.popupContainerRef} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="relative w-[360px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {this.state.isNameEditing ? (
                <input
                  autoFocus
                  value={this.state.editDraft.name}
                  onChange={(event) => this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, name: event.target.value } }))}
                  onBlur={this.handleNameCommit}
                  onKeyDown={(event) => event.key === 'Enter' && this.handleNameCommit()}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-base font-semibold text-gray-900 outline-none ring-blue-200 focus:ring"
                />
              ) : (
                <button type="button" onClick={() => this.setState({ isNameEditing: true })} className="max-w-full truncate text-left text-2xl font-semibold text-gray-900">
                  {pin.name}
                </button>
              )}
            </div>
            <button type="button" onClick={() => selectPin(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-600" aria-label="팝업 닫기">✕</button>
          </div>

          <div className="mb-3 flex items-center justify-between text-gray-500">
            <span className="truncate text-base">📍 {pin.position.lat.toFixed(4)}, {pin.position.lng.toFixed(4)}</span>
            <div className="ml-2 flex items-center gap-1 text-xl">
              <button type="button" onClick={() => this.setState((previousState) => ({ isEditMode: !previousState.isEditMode }))} className="rounded p-1 hover:bg-gray-100" aria-label="편집 모드">✏️</button>
              <button type="button" onClick={() => this.setState((previousState) => ({ isOpeningHoursEditorOpen: !previousState.isOpeningHoursEditorOpen }))} className="rounded p-1 hover:bg-gray-100" aria-label="영업시간 설정">🕒</button>
              <button type="button" onClick={() => this.imageInputRef.current?.click()} className="rounded p-1 hover:bg-gray-100" aria-label="사진 추가">📷</button>
              <button type="button" onClick={this.handleDeletePin} className="rounded p-1 hover:bg-gray-100" aria-label="삭제">🗑️</button>
            </div>
          </div>

          <input ref={this.imageInputRef} type="file" accept="image/*" onChange={this.handleImageChange} className="hidden" />

          {this.state.isEditMode ? (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">아이콘</label>
                <button type="button" className="flex items-center gap-2 rounded border px-2 py-1" onClick={() => this.setState((previousState) => ({ isIconPickerOpen: !previousState.isIconPickerOpen }))}>
                  <img src={currentPinIconPreset?.svgPath || DEFAULT_PIN_SVG_PATH} alt={currentPinIconPreset?.label || '기본'} className="h-5 w-5" />
                  <span>{currentPinIconPreset?.label || '기본'}</span>
                </button>
                {this.state.isIconPickerOpen ? (
                  <div className="mt-2 grid grid-cols-6 gap-1 rounded border p-2">
                    {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => (
                      <button key={iconPreset.key} type="button" onClick={() => updatePin(pin.id, { icon: iconPreset.key })} className="rounded p-1 hover:bg-gray-100" title={iconPreset.label}>
                        <img src={iconPreset.svgPath} alt={iconPreset.label} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
                <textarea
                  value={this.state.editDraft.memo}
                  onChange={(event) => {
                    const nextMemo = event.target.value
                    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, memo: nextMemo } }))
                    updatePin(pin.id, { memo: nextMemo })
                  }}
                  className="min-h-16 w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">카테고리</label>
                <select
                  value={this.state.editDraft.category}
                  onChange={(event) => {
                    const nextCategory = event.target.value
                    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, category: nextCategory } }))
                    updatePin(pin.id, { category: nextCategory })
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  {categoryOptionList.map((categoryOption) => (
                    <option key={categoryOption.key} value={categoryOption.key}>{categoryOption.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">태그</label>
                <div className="mb-2 flex flex-wrap gap-1">
                  {this.state.editDraft.tags.map((tagValue) => (
                    <button key={tagValue} type="button" onClick={() => {
                      const nextTags = this.state.editDraft.tags.filter((tagItem) => tagItem !== tagValue)
                      this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, tags: nextTags } }))
                      updatePin(pin.id, { tags: nextTags })
                    }} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">#{tagValue}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={this.state.tagDraftInput} onChange={(event) => this.setState({ tagDraftInput: event.target.value })} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" />
                  <button type="button" onClick={this.handleAddTag} className="rounded bg-blue-500 px-2 py-1 text-sm text-white">추가</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">체류시간</label>
                  <select
                    value={this.state.editDraft.stayDuration || '직접입력'}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      const nextDuration = nextValue === '직접입력' ? '' : nextValue
                      this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, stayDuration: nextDuration } }))
                      updatePin(pin.id, { stayDuration: nextDuration })
                    }}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    {stayDurationOptionList.map((durationOption) => <option key={durationOption} value={durationOption}>{durationOption}</option>)}
                  </select>
                  {isCustomStayDuration ? <input type="text" value={this.state.editDraft.stayDurationCustom} onChange={(event) => {
                    const stayDurationCustom = event.target.value
                    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, stayDurationCustom } }))
                    updatePin(pin.id, { stayDurationCustom })
                  }} className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm" /> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">예상 비용</label>
                  <input type="number" value={this.state.editDraft.cost} onChange={(event) => {
                    const cost = event.target.value
                    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, cost } }))
                    updatePin(pin.id, { cost })
                  }} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">색상 선택</label>
                <div className="flex flex-wrap gap-2">
                  {colorPresetList.map((colorHex) => {
                    const selectedColor = this.state.editDraft.color || PIN_MARKER_COLOR_PRESETS[this.state.editDraft.category || 'default']?.backgroundColor
                    const isColorSelected = selectedColor === colorHex
                    return (
                      <button key={colorHex} type="button" onClick={() => {
                        this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, color: colorHex } }))
                        updatePin(pin.id, { color: colorHex })
                      }} className={`h-6 w-6 rounded-full border-2 ${isColorSelected ? 'border-gray-900' : 'border-white'} shadow`} style={{ backgroundColor: colorHex }} />
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {this.state.isOpeningHoursEditorOpen ? (
            <div className="mt-3 rounded border border-orange-200 bg-orange-50 p-2">
              {openingHoursRangeList.map((timeRange, rangeIndex) => (
                <div key={`${pin.id}-range-${rangeIndex}`} className="mb-1 flex items-center gap-2">
                  <input type="time" value={timeRange.start || '09:00'} onChange={(event) => {
                    const nextOpeningHours = openingHoursRangeList.map((rangeItem, currentRangeIndex) => currentRangeIndex === rangeIndex ? { ...rangeItem, start: event.target.value } : rangeItem)
                    updatePin(pin.id, { openingHours: nextOpeningHours })
                  }} className="rounded border px-1 py-0.5 text-sm" />
                  <input type="time" value={timeRange.end || '18:00'} onChange={(event) => {
                    const nextOpeningHours = openingHoursRangeList.map((rangeItem, currentRangeIndex) => currentRangeIndex === rangeIndex ? { ...rangeItem, end: event.target.value } : rangeItem)
                    updatePin(pin.id, { openingHours: nextOpeningHours })
                  }} className="rounded border px-1 py-0.5 text-sm" />
                </div>
              ))}
              <button type="button" onClick={() => updatePin(pin.id, { openingHours: [...openingHoursRangeList, { start: '09:00', end: '18:00' }] })} className="rounded bg-white px-2 py-1 text-xs">+ 구간 추가</button>
            </div>
          ) : null}

          <TimelineBar openingHours={pin.openingHours} />
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[14px] border-l-transparent border-r-transparent border-t-white" />
        </div>
      </OverlayView>
    )
  }
}

export default withStore(PinPopup, { projectStore: useProjectStore })
