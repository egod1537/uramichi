import { create } from 'zustand'
import TOOL_MODES from '../utils/toolModes'
import HistoryManager from '../utils/HistoryManager'
import ProjectManager from '../utils/ProjectManager'

const initialProjectState = ProjectManager.createInitialProjectState()

const createSnapshotFromState = (state) => ({
  markers: state.markers,
  linePath: state.linePath,
  routePaths: state.routePaths,
  measurePath: state.measurePath,
})

const createDefaultPinData = (point, layerId, pinIndex) => ({
  id: `pin-${Date.now()}-${pinIndex + 1}`,
  layerId,
  name: `Pin ${pinIndex + 1}`,
  category: 'default',
  position: point,
})

const useProjectStore = create((set) => ({
  ...initialProjectState,
  setMode: (nextMode) =>
    set((state) => ({
      currentMode: nextMode,
      routeDraft: nextMode === TOOL_MODES.ADD_ROUTE ? state.routeDraft : { start: null },
    })),
  resetToSelectMode: () => set({ currentMode: TOOL_MODES.SELECT, routeDraft: { start: null } }),
  commitSnapshot: (nextSnapshot) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, nextSnapshot)
      return {
        markers: committedHistory.snapshot.markers,
        linePath: committedHistory.snapshot.linePath,
        routePaths: committedHistory.snapshot.routePaths,
        measurePath: committedHistory.snapshot.measurePath,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  addMarker: (point) =>
    set((state) => {
      const currentIsoDateTime = new Date().toISOString()
      const nextLayers = [...state.layers]
      let nextActiveLayerId = state.activeLayerId

      if (!nextActiveLayerId || !nextLayers.some((layerItem) => layerItem.id === nextActiveLayerId)) {
        const createdLayer = ProjectManager.createDefaultLayer(nextLayers.length)
        nextLayers.push(createdLayer)
        nextActiveLayerId = createdLayer.id
      }

      const createdPin = createDefaultPinData(point, nextActiveLayerId, state.pins.length)
      const nextPins = [...state.pins, createdPin]
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: [...state.markers, point],
      })

      return {
        ...committedHistory.snapshot,
        layers: nextLayers,
        pins: nextPins,
        activeLayerId: nextActiveLayerId,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: currentIsoDateTime,
      }
    }),
  appendLinePoint: (point) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        linePath: [...state.linePath, point],
      })
      return {
        ...committedHistory.snapshot,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  appendMeasurePoint: (point) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        measurePath: [...state.measurePath, point],
      })
      return {
        ...committedHistory.snapshot,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  setRouteStart: (point) => set({ routeDraft: { start: point } }),
  commitRoutePath: (path) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        routePaths: [...state.routePaths, path],
      })
      return {
        ...committedHistory.snapshot,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  undo: () =>
    set((state) => {
      const undoResult = HistoryManager.undo(state.history, state.historyIndex)
      if (!undoResult) return state
      return {
        ...undoResult.snapshot,
        routeDraft: { start: null },
        historyIndex: undoResult.historyIndex,
      }
    }),
  redo: () =>
    set((state) => {
      const redoResult = HistoryManager.redo(state.history, state.historyIndex)
      if (!redoResult) return state
      return {
        ...redoResult.snapshot,
        routeDraft: { start: null },
        historyIndex: redoResult.historyIndex,
      }
    }),
  addLayer: () =>
    set((state) => {
      const createdLayer = ProjectManager.createDefaultLayer(state.layers.length)
      return {
        layers: [...state.layers, createdLayer],
        activeLayerId: createdLayer.id,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  removeLayer: (layerId) =>
    set((state) => {
      const nextLayers = state.layers.filter((layerItem) => layerItem.id !== layerId)
      const nextPins = state.pins.filter((pinItem) => pinItem.layerId !== layerId)
      const isSelectedPinRemoved = state.pins.find((pinItem) => pinItem.id === state.selectedPinId)?.layerId === layerId
      const nextActiveLayerId = state.activeLayerId === layerId ? nextLayers[0]?.id ?? null : state.activeLayerId

      return {
        layers: nextLayers,
        pins: nextPins,
        selectedPinId: isSelectedPinRemoved ? null : state.selectedPinId,
        activeLayerId: nextActiveLayerId,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  renameLayer: (layerId, layerName) =>
    set((state) => ({
      layers: state.layers.map((layerItem) => (layerItem.id === layerId ? { ...layerItem, name: layerName } : layerItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layerItem) => (layerItem.id === layerId ? { ...layerItem, visible: !layerItem.visible } : layerItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  toggleLayerCollapse: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layerItem) => (layerItem.id === layerId ? { ...layerItem, collapsed: !layerItem.collapsed } : layerItem)),
    })),
  setMapTitle: (mapTitle) => set({ mapTitle, lastEditedAt: new Date().toISOString() }),
  updatePin: (pinId, patchData) =>
    set((state) => ({
      pins: state.pins.map((pinItem) => (pinItem.id === pinId ? { ...pinItem, ...patchData } : pinItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  removePin: (pinId) =>
    set((state) => ({
      pins: state.pins.filter((pinItem) => pinItem.id !== pinId),
      selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
      lastEditedAt: new Date().toISOString(),
    })),
  selectPin: (pinId) => set({ selectedPinId: pinId }),
}))

export default useProjectStore
