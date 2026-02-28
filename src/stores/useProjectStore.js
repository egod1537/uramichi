import { create } from 'zustand'
import TOOL_MODES from '../utils/toolModes'
import HistoryManager from '../utils/HistoryManager'
import ProjectManager from '../utils/ProjectManager'

const defaultTravelMode = 'WALKING'

const createLegacyLineId = (lineCount, legacyIndex) => `line-legacy-${Date.now()}-${lineCount + legacyIndex + 1}`

const convertLegacyMeasurementsToLines = (measurementList = [], currentLineCount = 0) =>
  measurementList.map((measurementItem, measurementIndex) => ({
    ...measurementItem,
    id: measurementItem.id || createLegacyLineId(currentLineCount, measurementIndex),
    shapeType: measurementItem.shapeType || 'line',
    sourceType: measurementItem.sourceType || 'measurement',
  }))

const normalizeLineList = (lineList = [], measurementList = []) =>
  lineList.concat(convertLegacyMeasurementsToLines(measurementList, lineList.length))

const rawInitialProjectState = ProjectManager.createInitialProjectState()
const initialProjectState = {
  ...rawInitialProjectState,
  lines: normalizeLineList(rawInitialProjectState.lines || [], rawInitialProjectState.measurements || []),
}

const createSnapshotFromState = (state) => ({
  markers: state.markers,
  lines: state.lines,
  routes: state.routes,
  routePaths: state.routePaths,
})

const createMarkersFromPins = (pinList) => pinList.map((pinItem) => pinItem.position)

const createDefaultPinData = (point, layerId, pinIndex, pinPatchData = {}) => ({
  id: `pin-${Date.now()}-${pinIndex + 1}`,
  layerId,
  name: `Pin ${pinIndex + 1}`,
  category: 'default',
  position: point,
  images: [],
  openingHours: [],
  ...pinPatchData,
})

export const createRouteId = (routeCount) => `route-${Date.now()}-${routeCount + 1}`

const resolveSelectablePinIdList = (pinIdList, pinList) => {
  const selectablePinIdSet = new Set(pinList.map((pinItem) => pinItem.id))
  return pinIdList.filter((pinId) => selectablePinIdSet.has(pinId))
}

const reorderItemList = (itemList, fromIndex, toIndex) => {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return itemList
  if (fromIndex >= itemList.length || toIndex >= itemList.length) return itemList
  const nextItemList = [...itemList]
  const [movedItem] = nextItemList.splice(fromIndex, 1)
  nextItemList.splice(toIndex, 0, movedItem)
  return nextItemList
}

const resolveReorderInsertIndex = (sourceIndex, targetIndex, dropPosition, itemCount) => {
  if (dropPosition === 'end') {
    return itemCount - 1
  }
  if (dropPosition === 'after') {
    const adjustedTargetIndex = targetIndex > sourceIndex ? targetIndex : targetIndex + 1
    return Math.min(adjustedTargetIndex, itemCount - 1)
  }
  return targetIndex
}

const reorderPinsByLayer = (pinList, layerId, sourcePinId, targetPinId, dropPosition = 'before') => {
  if (!sourcePinId) return pinList
  const layerPinIdList = pinList.filter((pinItem) => pinItem.layerId === layerId).map((pinItem) => pinItem.id)
  const sourceIndex = layerPinIdList.indexOf(sourcePinId)
  if (sourceIndex < 0) return pinList
  const targetIndex = dropPosition === 'end' ? layerPinIdList.length - 1 : layerPinIdList.indexOf(targetPinId)
  if (targetIndex < 0) return pinList
  const insertIndex = resolveReorderInsertIndex(sourceIndex, targetIndex, dropPosition, layerPinIdList.length)
  const reorderedLayerPinIdList = reorderItemList(layerPinIdList, sourceIndex, insertIndex)
  const pinOrderMap = new Map(reorderedLayerPinIdList.map((pinId, pinOrderIndex) => [pinId, pinOrderIndex]))
  return [...pinList].sort((firstPin, secondPin) => {
    const isFirstPinInLayer = firstPin.layerId === layerId
    const isSecondPinInLayer = secondPin.layerId === layerId
    if (!isFirstPinInLayer || !isSecondPinInLayer) return 0
    return (pinOrderMap.get(firstPin.id) ?? 0) - (pinOrderMap.get(secondPin.id) ?? 0)
  })
}

const reorderLinesByLayer = (lineList, layerId, sourceLineId, targetLineId, dropPosition = 'before') => {
  if (!sourceLineId) return lineList
  const layerLineIdList = lineList.filter((lineItem) => lineItem.layerId === layerId).map((lineItem) => lineItem.id)
  const sourceIndex = layerLineIdList.indexOf(sourceLineId)
  if (sourceIndex < 0) return lineList
  const targetIndex = dropPosition === 'end' ? layerLineIdList.length - 1 : layerLineIdList.indexOf(targetLineId)
  if (targetIndex < 0) return lineList
  const insertIndex = resolveReorderInsertIndex(sourceIndex, targetIndex, dropPosition, layerLineIdList.length)
  const reorderedLayerLineIdList = reorderItemList(layerLineIdList, sourceIndex, insertIndex)
  const lineOrderMap = new Map(reorderedLayerLineIdList.map((lineId, lineOrderIndex) => [lineId, lineOrderIndex]))
  return [...lineList].sort((firstLine, secondLine) => {
    const isFirstLineInLayer = firstLine.layerId === layerId
    const isSecondLineInLayer = secondLine.layerId === layerId
    if (!isFirstLineInLayer || !isSecondLineInLayer) return 0
    return (lineOrderMap.get(firstLine.id) ?? 0) - (lineOrderMap.get(secondLine.id) ?? 0)
  })
}

const reorderLayerObjectsByLayer = (pinList, lineList, layerId, sourceObject, targetObject, dropPosition = 'before') => {
  if (!sourceObject?.id || !targetObject?.id) {
    return { nextPins: pinList, nextLines: lineList }
  }

  const layerObjectList = [
    ...pinList.filter((pinItem) => pinItem.layerId === layerId).map((pinItem) => ({ type: 'pin', id: pinItem.id })),
    ...lineList.filter((lineItem) => lineItem.layerId === layerId).map((lineItem) => ({ type: 'line', id: lineItem.id })),
  ]
  const sourceIndex = layerObjectList.findIndex((objectItem) => objectItem.type === sourceObject.type && objectItem.id === sourceObject.id)
  if (sourceIndex < 0) {
    return { nextPins: pinList, nextLines: lineList }
  }

  const targetIndex = dropPosition === 'end'
    ? layerObjectList.length - 1
    : layerObjectList.findIndex((objectItem) => objectItem.type === targetObject.type && objectItem.id === targetObject.id)
  if (targetIndex < 0) {
    return { nextPins: pinList, nextLines: lineList }
  }

  const insertIndex = resolveReorderInsertIndex(sourceIndex, targetIndex, dropPosition, layerObjectList.length)
  const reorderedLayerObjectList = reorderItemList(layerObjectList, sourceIndex, insertIndex)
  const layerObjectOrderMap = new Map(reorderedLayerObjectList.map((objectItem, objectOrderIndex) => [`${objectItem.type}-${objectItem.id}`, objectOrderIndex]))

  const nextPins = [...pinList].sort((firstPin, secondPin) => {
    const firstPinOrder = layerObjectOrderMap.get(`pin-${firstPin.id}`)
    const secondPinOrder = layerObjectOrderMap.get(`pin-${secondPin.id}`)
    if (firstPinOrder == null || secondPinOrder == null) return 0
    return firstPinOrder - secondPinOrder
  })

  const nextLines = [...lineList].sort((firstLine, secondLine) => {
    const firstLineOrder = layerObjectOrderMap.get(`line-${firstLine.id}`)
    const secondLineOrder = layerObjectOrderMap.get(`line-${secondLine.id}`)
    if (firstLineOrder == null || secondLineOrder == null) return 0
    return firstLineOrder - secondLineOrder
  })

  return { nextPins, nextLines }
}

const useProjectStore = create((set) => ({
  ...initialProjectState,
  selectedLineId: null,
  poiSearchRequest: null,
  setMode: (nextMode) =>
    set((state) => ({
      currentMode: nextMode,
      routeDraft:
        nextMode === TOOL_MODES.ADD_ROUTE
          ? { start: state.routeDraft.start, travelMode: state.routeDraft.travelMode || defaultTravelMode }
          : { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
      selectedLineId: nextMode === TOOL_MODES.SELECT ? state.selectedLineId : null,
    })),
  resetToSelectMode: () =>
    set({
      currentMode: TOOL_MODES.SELECT,
      routeDraft: { start: null, travelMode: defaultTravelMode },
      selectedLineId: null,
    }),
  commitSnapshot: (nextSnapshot) =>
    set((state) => {
      const normalizedSnapshot = {
        ...nextSnapshot,
        lines: normalizeLineList(nextSnapshot.lines || [], nextSnapshot.measurements || []),
      }
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, normalizedSnapshot)
      return {
        markers: committedHistory.snapshot.markers,
        lines: committedHistory.snapshot.lines,
        routes: committedHistory.snapshot.routes,
        routePaths: committedHistory.snapshot.routePaths,
        routeDraft: { start: null, travelMode: state.routeDraft.travelMode || defaultTravelMode },
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
      }
    }),
  addMarker: (point, pinPatchData = {}) =>
    set((state) => {
      const nextLayers = [...state.layers]
      let nextActiveLayerId = state.activeLayerId

      if (!nextActiveLayerId || !nextLayers.some((layerItem) => layerItem.id === nextActiveLayerId)) {
        const createdLayer = ProjectManager.createDefaultLayer(nextLayers.length)
        nextLayers.push(createdLayer)
        nextActiveLayerId = createdLayer.id
      }

      const createdPin = createDefaultPinData(point, nextActiveLayerId, state.pins.length, pinPatchData)
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
  requestPoiFromSearch: (poiSearchRequest) => set({ poiSearchRequest }),
  consumePoiSearchRequest: () => set({ poiSearchRequest: null }),
  togglePinIconFilter: (iconKey) =>
    set((state) => ({
      pinIconFilters: state.pinIconFilters.includes(iconKey)
        ? state.pinIconFilters.filter((savedIconKey) => savedIconKey !== iconKey)
        : [...state.pinIconFilters, iconKey],
    })),
  clearPinIconFilter: () => set({ pinIconFilters: [] }),
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
  reorderLayers: (sourceLayerId, targetLayerId, dropPosition = 'before') =>
    set((state) => {
      if (!sourceLayerId || sourceLayerId === targetLayerId) return state
      const sourceLayerIndex = state.layers.findIndex((layerItem) => layerItem.id === sourceLayerId)
      if (sourceLayerIndex < 0) return state
      const targetLayerIndex = dropPosition === 'end' ? state.layers.length - 1 : state.layers.findIndex((layerItem) => layerItem.id === targetLayerId)
      if (targetLayerIndex < 0) return state
      const insertIndex = resolveReorderInsertIndex(sourceLayerIndex, targetLayerIndex, dropPosition, state.layers.length)
      return {
        layers: reorderItemList(state.layers, sourceLayerIndex, insertIndex),
        lastEditedAt: new Date().toISOString(),
      }
    }),
  reorderPinsInLayer: (layerId, sourcePinId, targetPinId, dropPosition = 'before') =>
    set((state) => {
      const nextPins = reorderPinsByLayer(state.pins, layerId, sourcePinId, targetPinId, dropPosition)
      if (nextPins === state.pins) return state
      return {
        pins: nextPins,
        markers: createMarkersFromPins(nextPins),
        lastEditedAt: new Date().toISOString(),
      }
    }),
  reorderLinesInLayer: (layerId, sourceLineId, targetLineId, dropPosition = 'before') =>
    set((state) => {
      const nextLines = reorderLinesByLayer(state.lines, layerId, sourceLineId, targetLineId, dropPosition)
      if (nextLines === state.lines) return state
      return {
        lines: nextLines,
        lastEditedAt: new Date().toISOString(),
      }
    }),
  reorderLayerObjectsInLayer: (layerId, sourceObject, targetObject, dropPosition = 'before') =>
    set((state) => {
      const { nextPins, nextLines } = reorderLayerObjectsByLayer(
        state.pins,
        state.lines,
        layerId,
        sourceObject,
        targetObject,
        dropPosition,
      )
      if (nextPins === state.pins && nextLines === state.lines) return state
      return {
        pins: nextPins,
        lines: nextLines,
        markers: createMarkersFromPins(nextPins),
        lastEditedAt: new Date().toISOString(),
      }
    }),
  addLine: (lineData) =>
    set((state) => {
      const nextLayers = [...state.layers]
      let resolvedLayerId = lineData.layerId
      if (!resolvedLayerId || !nextLayers.some((layerItem) => layerItem.id === resolvedLayerId)) {
        if (!nextLayers.length) {
          const createdLayer = ProjectManager.createDefaultLayer(nextLayers.length)
          nextLayers.push(createdLayer)
          resolvedLayerId = createdLayer.id
        } else {
          resolvedLayerId = state.activeLayerId && nextLayers.some((layerItem) => layerItem.id === state.activeLayerId)
            ? state.activeLayerId
            : nextLayers[0].id
        }
      }

      const normalizedShapeType = lineData.shapeType || 'line'
      const normalizedLineData = {
        ...lineData,
        shapeType: normalizedShapeType,
        name: lineData.name || (normalizedShapeType === 'polygon' ? `도형 ${state.lines.length + 1}` : `선 ${state.lines.length + 1}`),
        layerId: resolvedLayerId,
        sourceType: lineData.sourceType || 'line',
      }
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        lines: [...state.lines, normalizedLineData],
      })
      return {
        ...committedHistory.snapshot,
        layers: nextLayers,
        activeLayerId: resolvedLayerId,
        draftLinePoints: [],
        selectedLineId: normalizedLineData.id,
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
      const removedLineIdSet = new Set(state.lines.filter((lineItem) => lineItem.layerId === layerId).map((lineItem) => lineItem.id))
      const nextLines = state.lines.filter((lineItem) => lineItem.layerId !== layerId)
      const nextRoutes = state.routes.filter((routeItem) => routeItem.layerId !== layerId)
      const nextRoutePaths = nextRoutes.map((routeItem) => routeItem.path || [])
      const nextActiveLayerId = state.activeLayerId === layerId ? nextLayers[0]?.id ?? null : state.activeLayerId
      const committedHistory = HistoryManager.commit(state.history, state.historyIndex, {
        ...createSnapshotFromState(state),
        markers: createMarkersFromPins(nextPins),
        lines: nextLines,
        routes: nextRoutes,
        routePaths: nextRoutePaths,
      })
      return {
        ...committedHistory.snapshot,
        layers: nextLayers,
        pins: nextPins,
        selectedPinId: removedPinIdSet.has(state.selectedPinId) ? null : state.selectedPinId,
        selectedPinIds: state.selectedPinIds.filter((selectedPinIdItem) => !removedPinIdSet.has(selectedPinIdItem)),
        selectedLineId: removedLineIdSet.has(state.selectedLineId) ? null : state.selectedLineId,
        activeLayerId: nextActiveLayerId,
        history: committedHistory.history,
        historyIndex: committedHistory.historyIndex,
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
}))

export default useProjectStore
