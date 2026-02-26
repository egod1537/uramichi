import Map from './components/Map'

export default function App() {
  return (
    <div className="h-screen w-screen flex">
      {/* 사이드바 (나중에 핀 목록 들어갈 자리) */}
      <div className="w-80 border-r border-gray-200 bg-white p-4">
        <h1 className="text-xl font-bold">裏道 uramichi</h1>
        <p className="text-sm text-gray-500 mt-1">일본 힙스터 여행 플래너</p>
      </div>

      {/* 맵 영역 */}
      <div className="flex-1">
        <Map />
      </div>
    </div>
  )
}
