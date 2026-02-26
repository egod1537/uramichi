import { useState } from 'react'
import Search from './Search'

export default function Panel() {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    )
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-white rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden">
      {/* 헤더 */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h1 className="font-bold text-base">裏道 uramichi</h1>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* 검색 */}
      <div className="p-3 border-b border-gray-100">
        <Search />
      </div>

      {/* 핀 목록 (아직 비어있음) */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-sm text-gray-400 text-center mt-8">장소를 검색해서 핀을 추가해보세요</p>
      </div>
    </div>
  )
}
