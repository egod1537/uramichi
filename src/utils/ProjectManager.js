import TOOL_MODES from './toolModes'
import HistoryManager from './HistoryManager'

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
      routes: [],
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
      activeLayerId: null,
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
