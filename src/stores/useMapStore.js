import { create } from 'zustand'

export const TOOL_MODES = {
  SELECT: 'select',
  ADD_MARKER: 'add_marker',
  DRAW_LINE: 'draw_line',
  ADD_ROUTE: 'add_route',
  MEASURE_DISTANCE: 'measure_distance',
}

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
  {
    id: 'pin-1',
    layerId: 'day-1',
    name: '인천공항',
    category: 'airport',
    position: { lat: 37.4602, lng: 126.4407 },
  },
  {
    id: 'pin-2',
    layerId: 'day-1',
    name: '나가사키역',
    category: 'station',
    position: { lat: 32.7532, lng: 129.8706 },
  },
  {
    id: 'pin-3',
    layerId: 'day-1',
    name: '메가네바시',
    category: 'photo',
    position: { lat: 32.7475, lng: 129.8854 },
  },
  {
    id: 'pin-4',
    layerId: 'day-2',
    name: '군함도 크루즈 선착장',
    category: 'spot',
    position: { lat: 32.7332, lng: 129.8704 },
  },
  {
    id: 'pin-5',
    layerId: 'day-2',
    name: '쇼오켄',
    category: 'food',
    position: { lat: 32.7448, lng: 129.8737 },
  },
]

const updateTimestamp = () => new Date().toISOString()

const createEmptySnapshot = () => ({
  markers: [],
  linePath: [],
  routePaths: [],
  measurePath: [],
})

const cloneSnapshot = (snapshot) => ({
  markers: snapshot.markers.map((point) => ({ ...point })),
  linePath: snapshot.linePath.map((point) => ({ ...point })),
  routePaths: snapshot.routePaths.map((path) => path.map((point) => ({ ...point }))),
  measurePath: snapshot.measurePath.map((point) => ({ ...point })),
})

const applySnapshotState = (snapshot) => ({
  markers: snapshot.markers,
  linePath: snapshot.linePath,
  routePaths: snapshot.routePaths,
  measurePath: snapshot.measurePath,
  routeDraft: { start: null },
})

const useMapStore = create((set, get) => ({
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
  lastEditedAt: updateTimestamp(),
  selectedPinId: null,

  addPin: (pin) =>
    set((state) => ({
      pins: [...state.pins, pin],
      lastEditedAt: updateTimestamp(),
    })),

  removePin: (pinId) =>
    set((state) => ({
      pins: state.pins.filter((pin) => pin.id !== pinId),
      lastEditedAt: updateTimestamp(),
    })),

  addLayer: () =>
    set((state) => ({
      layers: [...state.layers, createDefaultLayer(state.layers.length)],
      lastEditedAt: updateTimestamp(),
    })),

  removeLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== layerId),
      pins: state.pins.filter((pin) => pin.layerId !== layerId),
      lastEditedAt: updateTimestamp(),
    })),

  renameLayer: (layerId, layerName) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, name: layerName } : layer,
      ),
      lastEditedAt: updateTimestamp(),
    })),

  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
      lastEditedAt: updateTimestamp(),
    })),

  toggleLayerCollapse: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, collapsed: !layer.collapsed } : layer,
      ),
    })),

  setMode: (nextMode) =>
    set((state) => ({
      currentMode: nextMode,
      routeDraft: nextMode === TOOL_MODES.ADD_ROUTE ? state.routeDraft : { start: null },
    })),

  setShortcutModalOpen: (isOpen) => set({ isShortcutModalOpen: isOpen }),

  resetToSelectMode: () => set({ currentMode: TOOL_MODES.SELECT, routeDraft: { start: null } }),

  commitSnapshot: (nextSnapshot) =>
    set((state) => {
      const trimmedHistory = state.history.slice(0, state.historyIndex + 1)
      const snapshotCopy = cloneSnapshot(nextSnapshot)
      const nextHistory = [...trimmedHistory, snapshotCopy]

      return {
        ...applySnapshotState(snapshotCopy),
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      }
    }),

  addMarker: (point) => {
    const mapState = get()
    const nextSnapshot = {
      markers: [...mapState.markers, point],
      linePath: mapState.linePath,
      routePaths: mapState.routePaths,
      measurePath: mapState.measurePath,
    }

    mapState.commitSnapshot(nextSnapshot)
  },

  appendLinePoint: (point) => {
    const mapState = get()
    const nextSnapshot = {
      markers: mapState.markers,
      linePath: [...mapState.linePath, point],
      routePaths: mapState.routePaths,
      measurePath: mapState.measurePath,
    }

    mapState.commitSnapshot(nextSnapshot)
  },

  appendMeasurePoint: (point) => {
    const mapState = get()
    const nextSnapshot = {
      markers: mapState.markers,
      linePath: mapState.linePath,
      routePaths: mapState.routePaths,
      measurePath: [...mapState.measurePath, point],
    }

    mapState.commitSnapshot(nextSnapshot)
  },

  setRouteStart: (point) => set({ routeDraft: { start: point } }),

  commitRoutePath: (path) =>
    set((state) => {
      const nextSnapshot = cloneSnapshot({
        markers: state.markers,
        linePath: state.linePath,
        routePaths: [...state.routePaths, path],
        measurePath: state.measurePath,
      })
      const trimmedHistory = state.history.slice(0, state.historyIndex + 1)
      const nextHistory = [...trimmedHistory, nextSnapshot]

      return {
        ...applySnapshotState(nextSnapshot),
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      }
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex === 0) return state
      const nextHistoryIndex = state.historyIndex - 1
      const snapshot = cloneSnapshot(state.history[nextHistoryIndex])

      return {
        ...applySnapshotState(snapshot),
        historyIndex: nextHistoryIndex,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const nextHistoryIndex = state.historyIndex + 1
      const snapshot = cloneSnapshot(state.history[nextHistoryIndex])

      return {
        ...applySnapshotState(snapshot),
        historyIndex: nextHistoryIndex,
      }
    }),

  setMapTitle: (mapTitle) =>
    set({
      mapTitle,
      lastEditedAt: updateTimestamp(),
    }),

  selectPin: (pinId) => set({ selectedPinId: pinId }),
}))

export default useMapStore
