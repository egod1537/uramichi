import { create } from 'zustand'
import TOOL_MODES from '../utils/toolModes'
import HistoryManager from '../utils/HistoryManager'
import ProjectManager from '../utils/ProjectManager'

const initialProjectState = ProjectManager.createInitialProjectState()

const createSnapshotFromState = (state) => ({
  markers: state.markers,
  lines: state.lines,
  routes: state.routes,
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
  images: [],
})

const resolveSelectablePinIdList = (pinIdList, pinList) => {
  const selectablePinIdSet = new Set(pinList.map((pinItem) => pinItem.id))
  return pinIdList.filter((pinId) => selectablePinIdSet.has(pinId))
}

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
        lines: committedHistory.snapshot.lines,
        routes: committedHistory.snapshot.routes,
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
        lastEditedAt: new Date().toISOString(),
      }
    }),
  selectPin: (pinId) => set({ selectedPinId: pinId, selectedPinIds: pinId ? [pinId] : [] }),
  selectPins: (pinIds) =>
    set((state) => {
      const nextSelectedPinIds = resolveSelectablePinIdList(pinIds, state.pins)
      return {
        selectedPinIds: nextSelectedPinIds,
        selectedPinId: nextSelectedPinIds[0] ?? null,
      }
    }),
  togglePinInSelection: (pinId) =>
    set((state) => {
      if (!state.pins.some((pinItem) => pinItem.id === pinId)) {
        return state
      }
      const nextSelectedPinIds = state.selectedPinIds.includes(pinId)
        ? state.selectedPinIds.filter((selectedPinIdItem) => selectedPinIdItem !== pinId)
        : [...state.selectedPinIds, pinId]
      return {
        selectedPinIds: nextSelectedPinIds,
        selectedPinId: nextSelectedPinIds[0] ?? null,
      }
    }),
  clearPinSelection: () => set({ selectedPinId: null, selectedPinIds: [] }),
  updatePin: (pinId, patchData) =>
    set((state) => ({
      pins: state.pins.map((pinItem) => (pinItem.id === pinId ? { ...pinItem, ...patchData } : pinItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  removePin: (pinId) =>
    set((state) => ({
      pins: state.pins.filter((pinItem) => pinItem.id !== pinId),
      selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
      selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => selectedPinIdItem !== pinId),
      lastEditedAt: new Date().toISOString(),
    })),
  removePins: (pinIds) =>
    set((state) => {
      const pinIdSetToRemove = new Set(pinIds)
      return {
        pins: state.pins.filter((pinItem) => !pinIdSetToRemove.has(pinItem.id)),
        selectedPinId: pinIdSetToRemove.has(state.selectedPinId) ? null : state.selectedPinId,
        selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => !pinIdSetToRemove.has(selectedPinIdItem)),
        lastEditedAt: new Date().toISOString(),
      }
    }),
  addLine: (lineData) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        lines: [...state.lines, lineData],
        linePath: [],
      })
      return {
        ...committedHistory.snapshot,
        draftLinePoints: [],
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  updateLine: (lineId, patchData) =>
    set((state) => ({
      lines: state.lines.map((lineItem) => (lineItem.id === lineId ? { ...lineItem, ...patchData } : lineItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  removeLine: (lineId) =>
    set((state) => ({
      lines: state.lines.filter((lineItem) => lineItem.id !== lineId),
      lastEditedAt: new Date().toISOString(),
    })),
  addRoute: (routeData) =>
    set((state) => {
      const nextRoutePathList = [...state.routePaths, routeData.path || []]
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        routes: [...state.routes, routeData],
        routePaths: nextRoutePathList,
      })
      return {
        ...committedHistory.snapshot,
        routeDraft: { start: null },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  removeRoute: (routeId) =>
    set((state) => ({
      routes: state.routes.filter((routeItem) => routeItem.id !== routeId),
      routePaths: state.routes.filter((routeItem) => routeItem.id !== routeId).map((routeItem) => routeItem.path || []),
      lastEditedAt: new Date().toISOString(),
    })),
  startDraftLine: (startPoint) => set({ draftLinePoints: [startPoint], linePath: [startPoint] }),
  appendDraftLinePoint: (point) =>
    set((state) => ({
      draftLinePoints: [...state.draftLinePoints, point],
      linePath: [...state.draftLinePoints, point],
    })),
  commitDraftLine: (lineData) =>
    set((state) => {
      if (state.draftLinePoints.length < 2) {
        return { draftLinePoints: [], linePath: [] }
      }
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        lines: [...state.lines, lineData],
        linePath: [],
      })
      return {
        ...committedHistory.snapshot,
        draftLinePoints: [],
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  cancelDraftLine: () => set({ draftLinePoints: [], linePath: [] }),
  startDraftMeasure: (startPoint) => set({ draftMeasurePoints: [startPoint], measurePath: [startPoint] }),
  appendDraftMeasurePoint: (point) =>
    set((state) => ({
      draftMeasurePoints: [...state.draftMeasurePoints, point],
      measurePath: [...state.draftMeasurePoints, point],
    })),
  completeDraftMeasure: () => set({ draftMeasurePoints: [], measurePath: [] }),
  cancelDraftMeasure: () => set({ draftMeasurePoints: [], measurePath: [] }),
  commitMarkerDrag: (nextMarkers) =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: nextMarkers,
      })
      return {
        ...committedHistory.snapshot,
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  setRouteStart: (point) => set({ routeDraft: { start: point } }),
  commitRoutePath: (path) =>
    set((state) => {
      const nextRouteData = {
        id: `route-${Date.now()}-${state.routes.length + 1}`,
        layerId: state.activeLayerId,
        start: path[0] || null,
        end: path[path.length - 1] || null,
        travelMode: 'DRIVING',
        summary: '',
        path,
      }
      const nextRoutePathList = [...state.routePaths, path]
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        routes: [...state.routes, nextRouteData],
        routePaths: nextRoutePathList,
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
        draftLinePoints: [],
        draftMeasurePoints: [],
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
        draftLinePoints: [],
        draftMeasurePoints: [],
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
      const removedPinIdSet = new Set(state.pins.filter((pinItem) => pinItem.layerId === layerId).map((pinItem) => pinItem.id))
      const nextPins = state.pins.filter((pinItem) => pinItem.layerId !== layerId)
      const nextActiveLayerId = state.activeLayerId === layerId ? nextLayers[0]?.id ?? null : state.activeLayerId
      return {
        layers: nextLayers,
        pins: nextPins,
        selectedPinId: removedPinIdSet.has(state.selectedPinId) ? null : state.selectedPinId,
        selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => !removedPinIdSet.has(selectedPinIdItem)),
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
  appendLinePoint: (point) =>
    set((state) => ({
      draftLinePoints: [...state.draftLinePoints, point],
      linePath: [...state.draftLinePoints, point],
    })),
  appendMeasurePoint: (point) =>
    set((state) => ({
      draftMeasurePoints: [...state.draftMeasurePoints, point],
      measurePath: [...state.draftMeasurePoints, point],
    })),
}))

export default useProjectStore
