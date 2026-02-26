import { useJsApiLoader } from '@react-google-maps/api'
import Map from './components/Map'
import Panel from './components/Panel'

const libraries = ['places']

export default function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  if (loadError) return <div className="p-4 text-red-500">맵 로딩 실패</div>
  if (!isLoaded) return <div className="p-4">로딩 중...</div>

  return (
    <div className="h-screen w-screen relative">
      {/* 맵 (풀스크린) */}
      <Map />

      {/* 떠 있는 패널 (구글 나만의 지도 스타일) */}
      <Panel />
    </div>
  )
}
