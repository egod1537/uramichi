import { useEffect, useState } from 'react'
import { LoadScript } from '@react-google-maps/api'
import Map from './components/Map/Map'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import ChatButton from './components/Chat/ChatButton'
import ChatPanel from './components/Chat/ChatPanel'
import Testbed from './pages/Testbed'
import { getRoute } from './route'
import useProjectStore from './stores/useProjectStore'
import { initializeLocalization } from './utils/L'

const libraries = ['places', 'geometry']

function App() {
  const currentRoute = getRoute()
  const currentMode = useProjectStore((state) => state.currentMode)
  const historyIndex = useProjectStore((state) => state.historyIndex)
  const historyLength = useProjectStore((state) => state.history.length)
  const [chatPanelOpen, setChatPanelOpen] = useState(false)

  useEffect(() => {
    initializeLocalization()
  }, [])

  if (currentRoute === 'testbed') {
    return (
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={<div className="p-4">로딩 중...</div>}
      >
        <Testbed currentMode={currentMode} historyIndex={historyIndex} historyLength={historyLength} />
      </LoadScript>
    )
  }

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div className="p-4">로딩 중...</div>}
    >
      <div className="relative h-screen w-screen bg-[#82c7d7]">
        <Map />
        <Sidebar />
        <Toolbar currentMode={currentMode} historyIndex={historyIndex} historyLength={historyLength} />
        {!chatPanelOpen && <ChatButton onClick={() => setChatPanelOpen(true)} />}
        <ChatPanel isOpen={chatPanelOpen} onClose={() => setChatPanelOpen(false)} />
      </div>
    </LoadScript>
  )
}

export default App
