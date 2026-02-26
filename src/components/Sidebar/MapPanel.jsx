export default function MapPanel() {
  return (
    <div className="border-b border-gray-100 p-3">
      <h1 className="font-bold text-base">裏道 uramichi</h1>
      <p className="mt-1 text-xs text-gray-500">Last edited: just now</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded bg-gray-100 px-2.5 py-1.5 text-xs hover:bg-gray-200">
          레이어 추가
        </button>
        <button type="button" className="rounded bg-gray-100 px-2.5 py-1.5 text-xs hover:bg-gray-200">
          공유
        </button>
      </div>
    </div>
  )
}
