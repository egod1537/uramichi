import { useState } from 'react'
import Search from '../Toolbar/Search'
import LayerPanel from './LayerPanel'
import MapPanel from './MapPanel'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-4 z-10 rounded-lg bg-white p-3 shadow-lg hover:bg-gray-50"
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
    <div className="absolute top-4 left-4 z-10 flex max-h-[calc(100vh-2rem)] w-80 flex-col overflow-hidden rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <h2 className="text-sm font-semibold text-gray-700">Sidebar</h2>
        <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1 hover:bg-gray-100">
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
      <MapPanel />
      <div className="border-b border-gray-100 p-3">
        <Search />
      </div>
      <LayerPanel />
    </div>
  )
}
