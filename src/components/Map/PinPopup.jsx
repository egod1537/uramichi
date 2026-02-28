import { useEffect, useMemo, useRef, useState } from 'react'
import { OverlayView } from '@react-google-maps/api'
import useProjectStore from '../../stores/useProjectStore'
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

function PinPopup({ pin }) {
  const popupContainerRef = useRef(null)
  const imageInputRef = useRef(null)
  const selectedPinId = useProjectStore((state) => state.selectedPinId)
  const updatePin = useProjectStore((state) => state.updatePin)
  const removePin = useProjectStore((state) => state.removePin)
  const selectPin = useProjectStore((state) => state.selectPin)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [isOpeningHoursEditorOpen, setIsOpeningHoursEditorOpen] = useState(false)
  const [isNameEditing, setIsNameEditing] = useState(false)
  const [tagDraftInput, setTagDraftInput] = useState('')
  const [editDraft, setEditDraft] = useState(() => ({
    name: pin.name || '',
    memo: pin.memo || '',
    category: pin.category || 'default',
    tags: pin.tags || [],
    stayDuration: pin.stayDuration || '1시간',
    stayDurationCustom: pin.stayDurationCustom || '',
    cost: pin.cost || '',
    color: pin.color || '',
  }))

  const categoryPreset = useMemo(() => CATEGORY_PRESETS[pin.category] || CATEGORY_PRESETS.default, [pin.category])
  const currentPinIconKey = getTravelPinIconKey(pin.icon || categoryPreset.icon)
  const currentPinIconPreset = getTravelPinIconPreset(currentPinIconKey)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!popupContainerRef.current?.contains(event.target)) {
        selectPin(null)
      }
    }

    const handleEscapeKeyDown = (event) => {
      if (event.key === 'Escape') {
        selectPin(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscapeKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscapeKeyDown)
    }
  }, [selectPin])

  if (!selectedPinId || selectedPinId !== pin.id) {
    return null
  }

  const isCustomStayDuration = editDraft.stayDuration === '' || Boolean(editDraft.stayDurationCustom)

  const handleNameCommit = () => {
    const trimmedName = editDraft.name.trim()
    const nextName = trimmedName || pin.name || ''
    setEditDraft((previousDraft) => ({ ...previousDraft, name: nextName }))
    if (nextName !== pin.name) {
      updatePin(pin.id, { name: nextName })
    }
    setIsNameEditing(false)
  }

  const handleDeletePin = () => {
    removePin(pin.id)
  }

  const handleAddTag = () => {
    const trimmedTag = tagDraftInput.trim()
    if (!trimmedTag) {
      return
    }
    if (editDraft.tags.includes(trimmedTag)) {
      setTagDraftInput('')
      return
    }
    const nextTags = [...editDraft.tags, trimmedTag]
    setEditDraft((previousDraft) => ({ ...previousDraft, tags: nextTags }))
    updatePin(pin.id, { tags: nextTags })
    setTagDraftInput('')
  }

  const handleRemoveTag = (tagValue) => {
    const nextTags = editDraft.tags.filter((tagItem) => tagItem !== tagValue)
    setEditDraft((previousDraft) => ({ ...previousDraft, tags: nextTags }))
    updatePin(pin.id, { tags: nextTags })
  }

  const handleImageButtonClick = () => {
    imageInputRef.current?.click()
  }

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    const imageDataUrl = await convertFileToDataUrl(selectedFile)
    const nextImageList = [...(pin.images || []), imageDataUrl]
    updatePin(pin.id, { images: nextImageList })
    event.target.value = ''
  }

  const handleImageRemove = (imageIndex) => {
    const nextImageList = (pin.images || []).filter((_, currentImageIndex) => currentImageIndex !== imageIndex)
    updatePin(pin.id, { images: nextImageList })
  }

  const openingHoursRangeList = Array.isArray(pin.openingHours) ? pin.openingHours : []

  const handleAddOpeningHoursRange = () => {
    const nextOpeningHours = [...openingHoursRangeList, { start: '09:00', end: '18:00' }]
    updatePin(pin.id, { openingHours: nextOpeningHours })
  }

  const handleOpeningHoursRangeChange = (rangeIndex, fieldName, fieldValue) => {
    const nextOpeningHours = openingHoursRangeList.map((timeRange, currentRangeIndex) => {
      if (currentRangeIndex !== rangeIndex) {
        return timeRange
      }
      return {
        ...timeRange,
        [fieldName]: fieldValue,
      }
    })
    updatePin(pin.id, { openingHours: nextOpeningHours })
  }

  const handleRemoveOpeningHoursRange = (rangeIndex) => {
    const nextOpeningHours = openingHoursRangeList.filter((_, currentRangeIndex) => currentRangeIndex !== rangeIndex)
    updatePin(pin.id, { openingHours: nextOpeningHours })
  }

  return (
    <OverlayView position={pin.position} mapPaneName={overlayPane}>
      <div
        ref={popupContainerRef}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="relative -translate-x-1/2 -translate-y-[calc(100%+22px)]"
      >
        <div className="w-[300px] max-w-[300px] rounded-2xl bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-start gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsIconPickerOpen((previousOpenState) => !previousOpenState)}
                className="mt-0.5 rounded-md px-1 text-xl hover:bg-gray-100"
                aria-label="아이콘 선택"
                title="아이콘 선택"
              >
                <img
                  src={currentPinIconPreset?.svgPath || DEFAULT_PIN_SVG_PATH}
                  alt={currentPinIconPreset?.label || '기본 아이콘'}
                  className="h-6 w-6"
                />
              </button>
              {isIconPickerOpen ? (
                <div className="absolute left-0 top-9 z-30 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="grid grid-cols-6 gap-1">
                    {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => {
                      const isSelectedIcon = currentPinIconKey === iconPreset.key
                      return (
                        <button
                          key={iconPreset.key}
                          type="button"
                          onClick={() => {
                            updatePin(pin.id, { icon: iconPreset.key })
                            setIsIconPickerOpen(false)
                          }}
                          className={`rounded-md px-1 py-1 text-xl hover:bg-gray-100 ${isSelectedIcon ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
                          title={iconPreset.label}
                          aria-label={iconPreset.label}
                        >
                          <img src={iconPreset.svgPath} alt={iconPreset.label} className="h-6 w-6" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              {isNameEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={editDraft.name}
                  onChange={(event) => setEditDraft((previousDraft) => ({ ...previousDraft, name: event.target.value }))}
                  onBlur={handleNameCommit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleNameCommit()
                    }
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-base font-semibold text-gray-900 outline-none ring-blue-200 focus:ring"
                />
              ) : (
                <button type="button" onClick={() => setIsNameEditing(true)} className="max-w-full truncate text-left text-2xl font-semibold text-gray-900">
                  {pin.name}
                </button>
              )}
            </div>
            <button type="button" onClick={() => selectPin(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-600" aria-label="팝업 닫기">
              ✕
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between text-gray-500">
            <span className="truncate text-base">📍 {pin.position.lat.toFixed(4)}, {pin.position.lng.toFixed(4)}</span>
            <div className="ml-2 flex items-center gap-1 text-xl">
              <button type="button" className="rounded p-1 hover:bg-gray-100" aria-label="경로 안내">◇</button>
              <button type="button" onClick={() => setIsEditMode((previousMode) => !previousMode)} className="rounded p-1 hover:bg-gray-100" aria-label="편집 모드">
                ✏️
              </button>
              <button
                type="button"
                onClick={() => setIsOpeningHoursEditorOpen((previousOpenState) => !previousOpenState)}
                className={`rounded p-1 hover:bg-gray-100 ${isOpeningHoursEditorOpen ? 'bg-orange-50 text-orange-600' : ''}`}
                aria-label="영업시간 설정"
                title="영업시간 설정"
              >
                🕒
              </button>
              <button type="button" onClick={handleImageButtonClick} className="rounded p-1 hover:bg-gray-100" aria-label="사진 추가">📷</button>
              <button type="button" onClick={handleDeletePin} className="rounded p-1 hover:bg-gray-100" aria-label="삭제">🗑️</button>
            </div>
          </div>

          {isOpeningHoursEditorOpen ? (
            <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-orange-700">영업시간</h3>
                <button type="button" onClick={handleAddOpeningHoursRange} className="rounded bg-white px-2 py-1 text-xs text-orange-700 hover:bg-orange-100">
                  + 구간 추가
                </button>
              </div>

              <div className="space-y-2">
                {openingHoursRangeList.map((timeRange, rangeIndex) => (
                  <div key={`${pin.id}-opening-hours-${rangeIndex}`} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={timeRange.start || '09:00'}
                      onChange={(event) => handleOpeningHoursRangeChange(rangeIndex, 'start', event.target.value)}
                      className="flex-1 rounded border border-orange-200 bg-white px-2 py-1 text-sm text-gray-700 outline-none ring-orange-200 focus:ring"
                    />
                    <span className="text-sm text-orange-600">~</span>
                    <input
                      type="time"
                      value={timeRange.end || '18:00'}
                      onChange={(event) => handleOpeningHoursRangeChange(rangeIndex, 'end', event.target.value)}
                      className="flex-1 rounded border border-orange-200 bg-white px-2 py-1 text-sm text-gray-700 outline-none ring-orange-200 focus:ring"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOpeningHoursRange(rangeIndex)}
                      className="rounded px-1 py-1 text-xs text-orange-700 hover:bg-orange-100"
                      aria-label={`영업시간 구간 ${rangeIndex + 1} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              {!openingHoursRangeList.length ? <p className="mt-2 text-xs text-orange-600">아직 설정된 영업시간이 없습니다.</p> : null}
            </div>
          ) : null}

          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

          {(pin.images || []).length ? (
            <div className="mb-3 grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">
              {(pin.images || []).map((imageDataUrl, imageIndex) => (
                <div key={`${pin.id}-image-${imageIndex}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img src={imageDataUrl} alt={`핀 이미지 ${imageIndex + 1}`} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(imageIndex)}
                    className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white hover:bg-black/75"
                    aria-label={`이미지 ${imageIndex + 1} 삭제`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {isEditMode ? (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
                <textarea
                  value={editDraft.memo}
                  onChange={(event) => {
                    const nextMemo = event.target.value
                    setEditDraft((previousDraft) => ({ ...previousDraft, memo: nextMemo }))
                    updatePin(pin.id, { memo: nextMemo })
                  }}
                  rows={3}
                  className="w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">카테고리</label>
                <select
                  value={editDraft.category}
                  onChange={(event) => {
                    const nextCategory = event.target.value
                    setEditDraft((previousDraft) => ({ ...previousDraft, category: nextCategory }))
                    updatePin(pin.id, { category: nextCategory })
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                >
                  {categoryOptionList.map((categoryOption) => (
                    <option key={categoryOption.key} value={categoryOption.key}>
                      {CATEGORY_PRESETS[categoryOption.key]?.icon} {categoryOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">태그</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagDraftInput}
                    onChange={(event) => setTagDraftInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="태그 입력 후 Enter"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                  />
                  <button type="button" onClick={handleAddTag} className="rounded bg-gray-100 px-2 text-sm text-gray-700 hover:bg-gray-200">
                    추가
                  </button>
                </div>
                {editDraft.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {editDraft.tags.map((tagItem) => (
                      <button
                        key={tagItem}
                        type="button"
                        onClick={() => handleRemoveTag(tagItem)}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                      >
                        #{tagItem} ×
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">체류시간</label>
                <div className="flex gap-2">
                  <select
                    value={isCustomStayDuration ? '직접입력' : editDraft.stayDuration || '1시간'}
                    onChange={(event) => {
                      const nextDuration = event.target.value
                      if (nextDuration === '직접입력') {
                        const nextPatch = { stayDuration: '', stayDurationCustom: editDraft.stayDurationCustom || '' }
                        setEditDraft((previousDraft) => ({ ...previousDraft, ...nextPatch }))
                        updatePin(pin.id, nextPatch)
                        return
                      }
                      const nextPatch = { stayDuration: nextDuration, stayDurationCustom: '' }
                      setEditDraft((previousDraft) => ({ ...previousDraft, ...nextPatch }))
                      updatePin(pin.id, nextPatch)
                    }}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                  >
                    {stayDurationOptionList.map((durationOption) => (
                      <option key={durationOption} value={durationOption}>
                        {durationOption}
                      </option>
                    ))}
                  </select>

                  {isCustomStayDuration ? (
                    <input
                      type="text"
                      value={editDraft.stayDurationCustom}
                      onChange={(event) => {
                        const nextCustomDuration = event.target.value
                        setEditDraft((previousDraft) => ({ ...previousDraft, stayDurationCustom: nextCustomDuration }))
                        updatePin(pin.id, { stayDurationCustom: nextCustomDuration })
                      }}
                      placeholder="예: 2시간 30분"
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-sm outline-none ring-blue-200 focus:ring"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">예상 비용</label>
                <div className="flex items-center rounded border border-gray-300 px-2">
                  <span className="text-sm text-gray-500">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={editDraft.cost}
                    onChange={(event) => {
                      const nextCost = event.target.value
                      setEditDraft((previousDraft) => ({ ...previousDraft, cost: nextCost }))
                      updatePin(pin.id, { cost: nextCost })
                    }}
                    className="w-full border-0 px-1 py-1 text-sm outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">색상 선택</label>
                <div className="flex flex-wrap gap-2">
                  {colorPresetList.map((colorHex) => {
                    const selectedColor = editDraft.color || PIN_MARKER_COLOR_PRESETS[editDraft.category || 'default']?.backgroundColor
                    const isColorSelected = selectedColor === colorHex
                    return (
                      <button
                        key={colorHex}
                        type="button"
                        onClick={() => {
                          setEditDraft((previousDraft) => ({ ...previousDraft, color: colorHex }))
                          updatePin(pin.id, { color: colorHex })
                        }}
                        className={`h-6 w-6 rounded-full border-2 ${isColorSelected ? 'border-gray-900' : 'border-white'} shadow`}
                        style={{ backgroundColor: colorHex }}
                        aria-label={`색상 ${colorHex}`}
                      />
                    )
                  })}
                </div>
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

export default PinPopup
