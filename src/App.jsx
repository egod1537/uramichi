import React from 'react'
import TOOL_MODES from './utils/toolModes'
import { LoadScript } from '@react-google-maps/api'
import Map from './components/Map/Map'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'

const libraries = ['places', 'geometry']

const initialLayers = [
  {
    id: 'day-1',
    name: 'Day 1',
    visible: true,
    collapsed: false,
    routes: [
      { id: 'route-1', fromPinId: 'pin-1', toPinId: 'pin-2', transport: 'flight' },
      { id: 'route-2', fromPinId: 'pin-2', toPinId: 'pin-3', transport: 'train' },
    ],
  },
  {
    id: 'day-2',
    name: 'Day 2',
    visible: true,
    collapsed: false,
    routes: [{ id: 'route-3', fromPinId: 'pin-4', toPinId: 'pin-5', transport: 'car' }],
  },
]

const initialPins = [
  { id: 'pin-1', layerId: 'day-1', name: '인천공항', category: 'airport', position: { lat: 37.4602, lng: 126.4407 } },
  { id: 'pin-2', layerId: 'day-1', name: '나가사키역', category: 'station', position: { lat: 32.7532, lng: 129.8706 } },
  { id: 'pin-3', layerId: 'day-1', name: '메가네바시', category: 'photo', position: { lat: 32.7475, lng: 129.8854 } },
  { id: 'pin-4', layerId: 'day-2', name: '군함도 크루즈 선착장', category: 'spot', position: { lat: 32.7332, lng: 129.8704 } },
  { id: 'pin-5', layerId: 'day-2', name: '쇼오켄', category: 'food', position: { lat: 32.7448, lng: 129.8737 } },
]

const createEmptySnapshot = () => ({ markers: [], linePath: [], routePaths: [], measurePath: [] })

const cloneSnapshot = (snapshot) => ({
  markers: snapshot.markers.map((point) => ({ ...point })),
  linePath: snapshot.linePath.map((point) => ({ ...point })),
  routePaths: snapshot.routePaths.map((path) => path.map((point) => ({ ...point }))),
  measurePath: snapshot.measurePath.map((point) => ({ ...point })),
})

const createDefaultLayer = (index) => {
  const layerNumber = index + 1
  return {
    id: `layer-${Date.now()}-${layerNumber}`,
    name: `Day ${layerNumber}`,
    visible: true,
    collapsed: false,
    routes: [],
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pins: initialPins,
      layers: initialLayers,
      currentMode: TOOL_MODES.SELECT,
      isShortcutModalOpen: false,
      markers: [],
      linePath: [],
      routePaths: [],
      measurePath: [],
      routeDraft: { start: null },
      history: [createEmptySnapshot()],
      historyIndex: 0,
      mapTitle: '제목없는 지도',
      lastEditedAt: new Date().toISOString(),
      selectedPinId: null,
    }
  }

  updateTimestamp = () => new Date().toISOString()

  setMode = (nextMode) => {
    this.setState((previousState) => ({
      currentMode: nextMode,
      routeDraft: nextMode === TOOL_MODES.ADD_ROUTE ? previousState.routeDraft : { start: null },
    }))
  }

  setShortcutModalOpen = (isOpen) => {
    this.setState({ isShortcutModalOpen: isOpen })
  }

  resetToSelectMode = () => {
    this.setState({ currentMode: TOOL_MODES.SELECT, routeDraft: { start: null } })
  }

  commitSnapshot = (nextSnapshot) => {
    this.setState((previousState) => {
      const trimmedHistory = previousState.history.slice(0, previousState.historyIndex + 1)
      const snapshotCopy = cloneSnapshot(nextSnapshot)
      const nextHistory = [...trimmedHistory, snapshotCopy]
      return {
        markers: snapshotCopy.markers,
        linePath: snapshotCopy.linePath,
        routePaths: snapshotCopy.routePaths,
        measurePath: snapshotCopy.measurePath,
        routeDraft: { start: null },
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      }
    })
  }

  addMarker = (point) => {
    this.commitSnapshot({
      markers: [...this.state.markers, point],
      linePath: this.state.linePath,
      routePaths: this.state.routePaths,
      measurePath: this.state.measurePath,
    })
  }

  appendLinePoint = (point) => {
    this.commitSnapshot({
      markers: this.state.markers,
      linePath: [...this.state.linePath, point],
      routePaths: this.state.routePaths,
      measurePath: this.state.measurePath,
    })
  }

  appendMeasurePoint = (point) => {
    this.commitSnapshot({
      markers: this.state.markers,
      linePath: this.state.linePath,
      routePaths: this.state.routePaths,
      measurePath: [...this.state.measurePath, point],
    })
  }

  setRouteStart = (point) => {
    this.setState({ routeDraft: { start: point } })
  }

  commitRoutePath = (path) => {
    this.setState((previousState) => {
      const nextSnapshot = cloneSnapshot({
        markers: previousState.markers,
        linePath: previousState.linePath,
        routePaths: [...previousState.routePaths, path],
        measurePath: previousState.measurePath,
      })
      const trimmedHistory = previousState.history.slice(0, previousState.historyIndex + 1)
      const nextHistory = [...trimmedHistory, nextSnapshot]
      return {
        markers: nextSnapshot.markers,
        linePath: nextSnapshot.linePath,
        routePaths: nextSnapshot.routePaths,
        measurePath: nextSnapshot.measurePath,
        routeDraft: { start: null },
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      }
    })
  }

  undo = () => {
    this.setState((previousState) => {
      if (previousState.historyIndex === 0) return null
      const nextHistoryIndex = previousState.historyIndex - 1
      const snapshot = cloneSnapshot(previousState.history[nextHistoryIndex])
      return {
        markers: snapshot.markers,
        linePath: snapshot.linePath,
        routePaths: snapshot.routePaths,
        measurePath: snapshot.measurePath,
        routeDraft: { start: null },
        historyIndex: nextHistoryIndex,
      }
    })
  }

  redo = () => {
    this.setState((previousState) => {
      if (previousState.historyIndex >= previousState.history.length - 1) return null
      const nextHistoryIndex = previousState.historyIndex + 1
      const snapshot = cloneSnapshot(previousState.history[nextHistoryIndex])
      return {
        markers: snapshot.markers,
        linePath: snapshot.linePath,
        routePaths: snapshot.routePaths,
        measurePath: snapshot.measurePath,
        routeDraft: { start: null },
        historyIndex: nextHistoryIndex,
      }
    })
  }

  addLayer = () => {
    this.setState((previousState) => ({
      layers: [...previousState.layers, createDefaultLayer(previousState.layers.length)],
      lastEditedAt: this.updateTimestamp(),
    }))
  }

  removeLayer = (layerId) => {
    this.setState((previousState) => ({
      layers: previousState.layers.filter((layerItem) => layerItem.id !== layerId),
      pins: previousState.pins.filter((pinItem) => pinItem.layerId !== layerId),
      selectedPinId:
        previousState.pins.find((pinItem) => pinItem.id === previousState.selectedPinId)?.layerId === layerId
          ? null
          : previousState.selectedPinId,
      lastEditedAt: this.updateTimestamp(),
    }))
  }

  renameLayer = (layerId, layerName) => {
    this.setState((previousState) => ({
      layers: previousState.layers.map((layerItem) =>
        layerItem.id === layerId ? { ...layerItem, name: layerName } : layerItem,
      ),
      lastEditedAt: this.updateTimestamp(),
    }))
  }

  toggleLayerVisibility = (layerId) => {
    this.setState((previousState) => ({
      layers: previousState.layers.map((layerItem) =>
        layerItem.id === layerId ? { ...layerItem, visible: !layerItem.visible } : layerItem,
      ),
      lastEditedAt: this.updateTimestamp(),
    }))
  }

  toggleLayerCollapse = (layerId) => {
    this.setState((previousState) => ({
      layers: previousState.layers.map((layerItem) =>
        layerItem.id === layerId ? { ...layerItem, collapsed: !layerItem.collapsed } : layerItem,
      ),
    }))
  }

  setMapTitle = (mapTitle) => {
    this.setState({ mapTitle, lastEditedAt: this.updateTimestamp() })
  }

  selectPin = (pinId) => {
    this.setState({ selectedPinId: pinId })
  }

  render() {
    const mapProps = {
      currentMode: this.state.currentMode,
      markers: this.state.markers,
      linePath: this.state.linePath,
      routePaths: this.state.routePaths,
      measurePath: this.state.measurePath,
      routeDraft: this.state.routeDraft,
      pins: this.state.pins,
      layers: this.state.layers,
      selectedPinId: this.state.selectedPinId,
      addMarker: this.addMarker,
      appendLinePoint: this.appendLinePoint,
      appendMeasurePoint: this.appendMeasurePoint,
      setRouteStart: this.setRouteStart,
      commitRoutePath: this.commitRoutePath,
      selectPin: this.selectPin,
    }

    const sidebarProps = {
      layers: this.state.layers,
      pins: this.state.pins,
      mapTitle: this.state.mapTitle,
      lastEditedAt: this.state.lastEditedAt,
      addLayer: this.addLayer,
      setMapTitle: this.setMapTitle,
      toggleLayerVisibility: this.toggleLayerVisibility,
      toggleLayerCollapse: this.toggleLayerCollapse,
      renameLayer: this.renameLayer,
      removeLayer: this.removeLayer,
      selectPin: this.selectPin,
    }

    const toolbarProps = {
      currentMode: this.state.currentMode,
      historyIndex: this.state.historyIndex,
      historyLength: this.state.history.length,
      isShortcutModalOpen: this.state.isShortcutModalOpen,
      setMode: this.setMode,
      resetToSelectMode: this.resetToSelectMode,
      undo: this.undo,
      redo: this.redo,
      setShortcutModalOpen: this.setShortcutModalOpen,
    }

    return (
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={<div className="p-4">로딩 중...</div>}
      >
        <div className="relative h-screen w-screen bg-[#82c7d7]">
          <Map {...mapProps} />
          <Sidebar {...sidebarProps} />
          <Toolbar {...toolbarProps} />
        </div>
      </LoadScript>
    )
  }
}

export default App
