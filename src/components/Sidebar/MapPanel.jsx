import { useMemo, useState } from 'react'
import useMapStore from '../../stores/useMapStore'

const formatLastEdited = (isoDateTime) => {
  const dateInstance = new Date(isoDateTime)

  return dateInstance.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function MapPanel() {
  const mapTitle = useMapStore((state) => state.mapTitle)
  const lastEditedAt = useMapStore((state) => state.lastEditedAt)
  const addLayer = useMapStore((state) => state.addLayer)
  const setMapTitle = useMapStore((state) => state.setMapTitle)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(mapTitle)

  const formattedDate = useMemo(() => formatLastEdited(lastEditedAt), [lastEditedAt])

  const handleTitleSave = () => {
    const trimmedTitle = draftTitle.trim()
    setMapTitle(trimmedTitle || '제목없는 지도')
    setIsEditingTitle(false)
  }

  const handleEditStart = () => {
    setDraftTitle(mapTitle)
    setIsEditingTitle(true)
  }

  return (
    <div className="border-b border-gray-200 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        {isEditingTitle ? (
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleTitleSave()
              }

              if (event.key === 'Escape') {
                setIsEditingTitle(false)
                setDraftTitle(mapTitle)
              }
            }}
            className="w-full rounded border border-blue-200 px-2 py-1 text-xl font-semibold text-gray-800 outline-none ring-blue-300 focus:ring"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={handleEditStart}
            className="truncate text-left text-xl font-semibold text-gray-800"
          >
            {mapTitle}
          </button>
        )}
        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="지도 옵션"
        >
          ⋮
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">{formattedDate} 마지막으로 수정됨</p>
      <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 text-sm">
        <button
          type="button"
          onClick={addLayer}
          className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100"
        >
          레이어 추가
        </button>
        <button type="button" className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">
          공유
        </button>
        <button type="button" className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">
          미리보기
        </button>
      </div>
    </div>
  )
}
