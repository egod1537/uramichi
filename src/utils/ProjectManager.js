import TOOL_MODES from './toolModes'
import HistoryManager from './HistoryManager'

class ProjectManager {
  static createInitialLayers() {
    return [
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
  }

  static createInitialPins() {
    return [
      { id: 'pin-1', layerId: 'day-1', name: '인천공항', category: 'airport', position: { lat: 37.4602, lng: 126.4407 } },
      { id: 'pin-2', layerId: 'day-1', name: '나가사키역', category: 'station', position: { lat: 32.7532, lng: 129.8706 } },
      { id: 'pin-3', layerId: 'day-1', name: '메가네바시', category: 'photo', position: { lat: 32.7475, lng: 129.8854 } },
      { id: 'pin-4', layerId: 'day-2', name: '군함도 크루즈 선착장', category: 'spot', position: { lat: 32.7332, lng: 129.8704 } },
      { id: 'pin-5', layerId: 'day-2', name: '쇼오켄', category: 'food', position: { lat: 32.7448, lng: 129.8737 } },
    ]
  }

  static createDefaultLayer(layerIndex) {
    const layerNumber = layerIndex + 1
    return {
      id: `layer-${Date.now()}-${layerNumber}`,
      name: `Day ${layerNumber}`,
      visible: true,
      collapsed: false,
      routes: [],
    }
  }

  static createInitialProjectState() {
    return {
      pins: ProjectManager.createInitialPins(),
      layers: ProjectManager.createInitialLayers(),
      participants: [],
      currentMode: TOOL_MODES.SELECT,
      markers: [],
      linePath: [],
      routePaths: [],
      measurePath: [],
      routeDraft: { start: null },
      history: [HistoryManager.createEmptySnapshot()],
      historyIndex: 0,
      mapTitle: '제목없는 지도',
      lastEditedAt: new Date().toISOString(),
      selectedPinId: null,
    }
  }

  static isValidProject(projectData) {
    return (
      projectData &&
      Array.isArray(projectData.pins) &&
      Array.isArray(projectData.layers) &&
      Array.isArray(projectData.history) &&
      typeof projectData.historyIndex === 'number'
    )
  }
}

export default ProjectManager
