import { useJsApiLoader } from '@react-google-maps/api'
import Map from './components/Map/Map'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'

const libraries = ['places', 'geometry']

export default function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  if (loadError) return <div className="p-4 text-red-500">맵 로딩 실패</div>
  if (!isLoaded) return <div className="p-4">로딩 중...</div>

  return (
    <div className="relative h-screen w-screen bg-[#82c7d7]">
      <Map />
      <Sidebar />
      <Toolbar />
    </div>
  )
}
