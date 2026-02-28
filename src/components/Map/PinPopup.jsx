import React from 'react'
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

class PinPopup extends React.Component {
  constructor(props) {
    super(props)
    this.popupContainerRef = React.createRef()
    this.imageInputRef = React.createRef()
    this.state = this.createInitialState(props)
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleEscapeKeyDown)
  }

  componentDidUpdate(previousProps) {
    if (previousProps.pin.id !== this.props.pin.id || previousProps.pin.updatedAt !== this.props.pin.updatedAt) {
      this.setState(this.createInitialState(this.props))
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleEscapeKeyDown)
  }

  createInitialState = (props) => ({
    isEditMode: false,
    isIconPickerOpen: false,
    isOpeningHoursEditorOpen: false,
    isNameEditing: false,
    tagDraftInput: '',
    editDraft: {
      name: props.pin.name || '',
      memo: props.pin.memo || '',
      category: props.pin.category || 'default',
      tags: props.pin.tags || [],
      stayDuration: props.pin.stayDuration || '1시간',
      stayDurationCustom: props.pin.stayDurationCustom || '',
      cost: props.pin.cost || '',
      color: props.pin.color || '',
    },
  })

  handleOutsideClick = (event) => {
    if (!this.popupContainerRef.current?.contains(event.target)) {
      this.props.projectStore.selectPin(null)
    }
  }

  handleEscapeKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.props.projectStore.selectPin(null)
    }
  }

  handleNameCommit = () => {
    const { pin, projectStore } = this.props
    const trimmedName = this.state.editDraft.name.trim()
    const nextName = trimmedName || pin.name || ''
    this.setState((previousState) => ({
      editDraft: { ...previousState.editDraft, name: nextName },
      isNameEditing: false,
    }))
    if (nextName !== pin.name) {
      projectStore.updatePin(pin.id, { name: nextName })
    }
  }

  handleAddTag = () => {
    const { pin, projectStore } = this.props
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
    projectStore.updatePin(pin.id, { tags: nextTags })
  }

  handleRemoveTag = (tagValue) => {
    const { pin, projectStore } = this.props
    const nextTags = this.state.editDraft.tags.filter((tagItem) => tagItem !== tagValue)
    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, tags: nextTags } }))
    projectStore.updatePin(pin.id, { tags: nextTags })
  }

  handleImageButtonClick = () => {
    this.imageInputRef.current?.click()
  }

  handleImageChange = async (event) => {
    const { pin, projectStore } = this.props
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    const imageDataUrl = await convertFileToDataUrl(selectedFile)
    const nextImageList = [...(pin.images || []), imageDataUrl]
    projectStore.updatePin(pin.id, { images: nextImageList })
    event.target.value = ''
  }

  handleImageRemove = (imageIndex) => {
    const { pin, projectStore } = this.props
    const nextImageList = (pin.images || []).filter((_, currentImageIndex) => currentImageIndex !== imageIndex)
    projectStore.updatePin(pin.id, { images: nextImageList })
  }

  render() {
    const { pin, projectStore } = this.props
    const { selectedPinId, updatePin, removePin } = projectStore
    const { isEditMode, isIconPickerOpen, isOpeningHoursEditorOpen, isNameEditing, tagDraftInput, editDraft } = this.state

    if (!selectedPinId || selectedPinId !== pin.id) return null

    const categoryPreset = CATEGORY_PRESETS[pin.category] || CATEGORY_PRESETS.default
    const currentPinIconKey = getTravelPinIconKey(pin.icon || categoryPreset.icon)
    const currentPinIconPreset = getTravelPinIconPreset(currentPinIconKey)
    const isCustomStayDuration = editDraft.stayDuration === '' || Boolean(editDraft.stayDurationCustom)
    const openingHoursRangeList = Array.isArray(pin.openingHours) ? pin.openingHours : []

    return (
      <OverlayView position={pin.position} mapPaneName={overlayPane}>
        <div
          ref={this.popupContainerRef}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className="relative w-[360px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-start gap-2">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-1 hover:bg-gray-50"
              onClick={() => this.setState((previousState) => ({ isIconPickerOpen: !previousState.isIconPickerOpen }))}
            >
              <img src={currentPinIconPreset?.svgPath || DEFAULT_PIN_SVG_PATH} alt={currentPinIconPreset?.label || '기본 아이콘'} className="h-6 w-6" />
            </button>
            <div className="min-w-0 flex-1">
              {isNameEditing ? (
                <input
                  value={editDraft.name}
                  onChange={(event) => this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, name: event.target.value } }))}
                  onBlur={this.handleNameCommit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') this.handleNameCommit()
                    if (event.key === 'Escape') this.setState({ isNameEditing: false })
                  }}
                  autoFocus
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                <button type="button" onClick={() => this.setState({ isNameEditing: true })} className="truncate text-left text-base font-semibold text-gray-900">
                  {pin.name || '이름 없음'}
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500">{categoryPreset.label}</p>
            </div>
            <button type="button" onClick={() => removePin(pin.id)} className="rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50">삭제</button>
            <button type="button" onClick={() => this.setState((previousState) => ({ isEditMode: !previousState.isEditMode }))} className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50">
              {isEditMode ? '완료' : '편집'}
            </button>
          </div>

          {isIconPickerOpen ? (
            <div className="mb-2 grid grid-cols-6 gap-1 rounded-lg border border-gray-200 p-2">
              {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => (
                <button
                  key={iconPreset.key}
                  type="button"
                  onClick={() => {
                    updatePin(pin.id, { icon: iconPreset.key })
                    this.setState({ isIconPickerOpen: false })
                  }}
                  className={`rounded p-1 hover:bg-gray-100 ${currentPinIconKey === iconPreset.key ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
                >
                  <img src={iconPreset.svgPath} alt={iconPreset.label} className="h-5 w-5" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <textarea
              value={editDraft.memo}
              onChange={(event) => {
                const nextMemoValue = event.target.value
                this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, memo: nextMemoValue } }))
                updatePin(pin.id, { memo: nextMemoValue })
              }}
              className="h-20 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="메모"
            />

            <div className="flex flex-wrap gap-1">
              {editDraft.tags.map((tagItem) => (
                <button key={tagItem} type="button" onClick={() => this.handleRemoveTag(tagItem)} className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                  #{tagItem} ✕
                </button>
              ))}
              <input
                value={tagDraftInput}
                onChange={(event) => this.setState({ tagDraftInput: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    this.handleAddTag()
                  }
                }}
                className="min-w-[80px] flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                placeholder="태그 추가"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={this.handleImageButtonClick} className="rounded border border-gray-300 px-2 py-1 text-sm">📷 이미지</button>
              <input ref={this.imageInputRef} type="file" accept="image/*" className="hidden" onChange={this.handleImageChange} />
              <button
                type="button"
                onClick={() => this.setState((previousState) => ({ isOpeningHoursEditorOpen: !previousState.isOpeningHoursEditorOpen }))}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                영업시간
              </button>
            </div>

            {!!pin.images?.length && (
              <div className="grid grid-cols-3 gap-2">
                {pin.images.map((imageSource, imageIndex) => (
                  <div key={`${imageSource}-${imageIndex}`} className="relative overflow-hidden rounded border border-gray-200">
                    <img src={imageSource} alt={`pin-${imageIndex}`} className="h-20 w-full object-cover" />
                    <button type="button" onClick={() => this.handleImageRemove(imageIndex)} className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white">✕</button>
                  </div>
                ))}
              </div>
            )}

            {isOpeningHoursEditorOpen ? (
              <div className="space-y-2 rounded border border-gray-200 p-2">
                {openingHoursRangeList.map((rangeItem, rangeIndex) => (
                  <div key={`${rangeItem.start}-${rangeItem.end}-${rangeIndex}`} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={rangeItem.start}
                      onChange={(event) => {
                        const nextOpeningHours = openingHoursRangeList.map((timeRange, currentRangeIndex) =>
                          currentRangeIndex === rangeIndex ? { ...timeRange, start: event.target.value } : timeRange,
                        )
                        updatePin(pin.id, { openingHours: nextOpeningHours })
                      }}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <span>~</span>
                    <input
                      type="time"
                      value={rangeItem.end}
                      onChange={(event) => {
                        const nextOpeningHours = openingHoursRangeList.map((timeRange, currentRangeIndex) =>
                          currentRangeIndex === rangeIndex ? { ...timeRange, end: event.target.value } : timeRange,
                        )
                        updatePin(pin.id, { openingHours: nextOpeningHours })
                      }}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpeningHours = openingHoursRangeList.filter((_, currentRangeIndex) => currentRangeIndex !== rangeIndex)
                        updatePin(pin.id, { openingHours: nextOpeningHours })
                      }}
                      className="text-xs text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updatePin(pin.id, { openingHours: [...openingHoursRangeList, { start: '09:00', end: '18:00' }] })}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  시간대 추가
                </button>
              </div>
            ) : null}

            {isEditMode ? (
              <div className="space-y-2 rounded border border-gray-100 p-2">
                <select
                  value={editDraft.category}
                  onChange={(event) => {
                    const nextCategoryKey = event.target.value
                    this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, category: nextCategoryKey } }))
                    updatePin(pin.id, { category: nextCategoryKey })
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  {categoryOptionList.map((categoryOption) => (
                    <option key={categoryOption.key} value={categoryOption.key}>{categoryOption.label}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={isCustomStayDuration ? '' : editDraft.stayDuration}
                    onChange={(event) => {
                      const nextDurationValue = event.target.value
                      this.setState((previousState) => ({
                        editDraft: {
                          ...previousState.editDraft,
                          stayDuration: nextDurationValue,
                          stayDurationCustom: nextDurationValue === '' ? previousState.editDraft.stayDurationCustom : '',
                        },
                      }))
                      updatePin(pin.id, { stayDuration: nextDurationValue, stayDurationCustom: nextDurationValue === '' ? editDraft.stayDurationCustom : '' })
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    {stayDurationOptionList.map((durationOption) => (
                      <option key={durationOption} value={durationOption === '직접입력' ? '' : durationOption}>{durationOption}</option>
                    ))}
                  </select>
                  {isCustomStayDuration ? (
                    <input
                      type="text"
                      value={editDraft.stayDurationCustom}
                      onChange={(event) => {
                        const nextCustomDuration = event.target.value
                        this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, stayDurationCustom: nextCustomDuration } }))
                        updatePin(pin.id, { stayDurationCustom: nextCustomDuration })
                      }}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : null}
                </div>

                <div className="flex items-center rounded border border-gray-300 px-2">
                  <span className="text-sm text-gray-500">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={editDraft.cost}
                    onChange={(event) => {
                      const nextCostValue = event.target.value
                      this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, cost: nextCostValue } }))
                      updatePin(pin.id, { cost: nextCostValue })
                    }}
                    className="w-full border-0 px-1 py-1 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {colorPresetList.map((colorHex) => {
                    const selectedColor = editDraft.color || PIN_MARKER_COLOR_PRESETS[editDraft.category || 'default']?.backgroundColor
                    const isColorSelected = selectedColor === colorHex
                    return (
                      <button
                        key={colorHex}
                        type="button"
                        onClick={() => {
                          this.setState((previousState) => ({ editDraft: { ...previousState.editDraft, color: colorHex } }))
                          updatePin(pin.id, { color: colorHex })
                        }}
                        className={`h-6 w-6 rounded-full border-2 ${isColorSelected ? 'border-gray-900' : 'border-white'} shadow`}
                        style={{ backgroundColor: colorHex }}
                      />
                    )
                  })}
                </div>
              </div>
            ) : null}
            <TimelineBar openingHours={pin.openingHours} />
          </div>
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[14px] border-l-transparent border-r-transparent border-t-white" />
        </div>
      </OverlayView>
    )
  }
}

const ConnectedPinPopup = withStore(PinPopup, { projectStore: useProjectStore })

export default ConnectedPinPopup
