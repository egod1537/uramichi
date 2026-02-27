import { create } from 'zustand'
import TOOL_MODES from '../utils/toolModes'
import HistoryManager from '../utils/HistoryManager'
import ProjectManager from '../utils/ProjectManager'

const initialProjectState = ProjectManager.createInitialProjectState()
const defaultTravelMode = 'WALKING'

const createSnapshotFromState = (state) => ({
  markers: state.markers,
  lines: state.lines,
  routes: state.routes,
  linePath: state.linePath,
  routePaths: state.routePaths,
  measurePath: state.measurePath,
})

const createMarkersFromPins = (pinList) => pinList.map((pinItem) => pinItem.position)

const createDefaultPinData = (point, layerId, pinIndex) => ({
  id: `pin-${Date.now()}-${pinIndex + 1}`,
  layerId,
  name: `Pin ${pinIndex + 1}`,
  category: 'default',
  position: point,
  images: [],
})

export const createRouteId = (routeCount) => `route-${Date.now()}-${routeCount + 1}`

const resolveSelectablePinIdList = (pinIdList, pinList) => {
  const selectablePinIdSet = new Set(pinList.map((pinItem) => pinItem.id))
  return pinIdList.filter((pinId) => selectablePinIdSet.has(pinId))
}

const useProjectStore = create((set) => ({
  ...initialProjectState,
  selectedLineId: null,
  setMode: (nextMode) =>
    set((state) => ({
      currentMode: nextMode,
      routeDraft:
        nextMode === TOOL_MODES.ADD_ROUTE
          ? { start: state.routeDraft.start, travelMode: state.routeDraft.travelMode || defaultTravelMode }
          : { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
      draftMeasurePoints: nextMode === TOOL_MODES.MEASURE_DISTANCE ? state.draftMeasurePoints : [],
      measurePath: nextMode === TOOL_MODES.MEASURE_DISTANCE ? state.measurePath : [],
      selectedLineId: nextMode === TOOL_MODES.SELECT ? state.selectedLineId : null,
    })),
  resetToSelectMode: () =>
    set({
      currentMode: TOOL_MODES.SELECT,
      routeDraft: { start: null, travelMode: defaultTravelMode },
      draftMeasurePoints: [],
      measurePath: [],
      selectedLineId: null,
    }),
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
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
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
        markers: createMarkersFromPins(nextPins),
      })

      return {
        ...committedHistory.snapshot,
        layers: nextLayers,
        pins: nextPins,
        activeLayerId: nextActiveLayerId,
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
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
    set((state) => {
      const nextPins = state.pins.map((pinItem) => (pinItem.id === pinId ? { ...pinItem, ...patchData } : pinItem))
      return {
        pins: nextPins,
        markers: createMarkersFromPins(nextPins),
        lastEditedAt: new Date().toISOString(),
      }
    }),
  removePin: (pinId) =>
    set((state) => {
      const nextPins = state.pins.filter((pinItem) => pinItem.id !== pinId)
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: createMarkersFromPins(nextPins),
      })
      return {
        ...committedHistory.snapshot,
        pins: nextPins,
        selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
        selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => selectedPinIdItem !== pinId),
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  removePins: (pinIds) =>
    set((state) => {
      const pinIdSetToRemove = new Set(pinIds)
      const nextPins = state.pins.filter((pinItem) => !pinIdSetToRemove.has(pinItem.id))
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: createMarkersFromPins(nextPins),
      })
      return {
        ...committedHistory.snapshot,
        pins: nextPins,
        selectedPinId: pinIdSetToRemove.has(state.selectedPinId) ? null : state.selectedPinId,
        selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => !pinIdSetToRemove.has(selectedPinIdItem)),
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  movePinsToLayer: (pinIds, layerId) =>
    set((state) => {
      if (!layerId) return state
      const hasTargetLayer = state.layers.some((layerItem) => layerItem.id === layerId)
      if (!hasTargetLayer) return state
      const selectedPinIdSet = new Set(pinIds)
      if (!selectedPinIdSet.size) return state
      const nextPins = state.pins.map((pinItem) =>
        selectedPinIdSet.has(pinItem.id)
          ? {
              ...pinItem,
              layerId,
            }
          : pinItem,
      )
      return {
        pins: nextPins,
        markers: createMarkersFromPins(nextPins),
        activeLayerId: layerId,
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
        selectedLineId: lineData.id,
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  selectLine: (lineId) => set({ selectedLineId: lineId }),
  updateLine: (lineId, patchData) =>
    set((state) => ({
      lines: state.lines.map((lineItem) => (lineItem.id === lineId ? { ...lineItem, ...patchData } : lineItem)),
      lastEditedAt: new Date().toISOString(),
    })),
  removeLine: (lineId) =>
    set((state) => {
      const nextLines = state.lines.filter((lineItem) => lineItem.id !== lineId)
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        lines: nextLines,
      })
      return {
        ...committedHistory.snapshot,
        selectedLineId: state.selectedLineId === lineId ? null : state.selectedLineId,
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
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
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  removeRoute: (routeId) =>
    set((state) => {
      const nextRoutes = state.routes.filter((routeItem) => routeItem.id !== routeId)
      const nextRoutePaths = nextRoutes.map((routeItem) => routeItem.path || [])
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        routes: nextRoutes,
        routePaths: nextRoutePaths,
      })
      return {
        ...committedHistory.snapshot,
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
        lastEditedAt: new Date().toISOString(),
      }
    }),
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
  commitMarkerDrag: () =>
    set((state) => {
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: createMarkersFromPins(state.pins),
      })
      return {
        ...committedHistory.snapshot,
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  setRouteStart: (point) =>
    set((state) => ({
      routeDraft: { start: point, travelMode: state.routeDraft.travelMode || defaultTravelMode },
    })),
  setRouteTravelMode: (travelMode) =>
    set((state) => ({
      routeDraft: { start: state.routeDraft.start, travelMode },
    })),
  commitRoutePath: (path) =>
    set((state) => {
      const nextRouteData = {
        id: createRouteId(state.routes.length),
        layerId: state.activeLayerId,
        start: path[0] || null,
        end: path[path.length - 1] || null,
        travelMode: state.routeDraft.travelMode || defaultTravelMode,
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
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
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
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
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
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
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
        markers: createMarkersFromPins(nextPins),
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
  setMeasurePath: (measurePointList) =>
    set({
      draftMeasurePoints: measurePointList,
      measurePath: measurePointList,
    }),
}))

export default useProjectStore
