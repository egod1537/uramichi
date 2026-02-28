import TOOL_MODES from './toolModes'
import HistoryManager from './HistoryManager'
import { TIME_FILTER_DEFAULT_RANGE } from './config'

class ProjectManager {
  static createInitialLayers() {
    return []
  }

  static createInitialPins() {
    return []
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
      lines: [],
      routes: [],
      participants: [],
      currentMode: TOOL_MODES.SELECT,
      markers: [],
      routePaths: [],
      routeDraft: { start: null, travelMode: 'WALKING' },
      history: [HistoryManager.createEmptySnapshot()],
      historyIndex: 0,
      mapTitle: '제목없는 지도',
      lastEditedAt: new Date().toISOString(),
      selectedPinId: null,
      selectedPinIds: [],
      activeLayerId: null,
      pinIconFilters: [],
      timeFilterRange: TIME_FILTER_DEFAULT_RANGE,
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
