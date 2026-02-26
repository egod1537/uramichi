import { create } from 'zustand'

export const TOOL_MODES = {
  SELECT: 'select',
  ADD_MARKER: 'add_marker',
  DRAW_LINE: 'draw_line',
  ADD_ROUTE: 'add_route',
  MEASURE_DISTANCE: 'measure_distance',
}

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

const applySnapshotState = (state, snapshot) => ({
  ...state,
  markers: snapshot.markers,
  linePath: snapshot.linePath,
  routePaths: snapshot.routePaths,
  measurePath: snapshot.measurePath,
  routeDraft: { start: null },
})

const useMapStore = create((set, get) => ({
  pins: [],
  layers: [],
  currentMode: TOOL_MODES.SELECT,
  isShortcutModalOpen: false,
  markers: [],
  linePath: [],
  routePaths: [],
  measurePath: [],
  routeDraft: { start: null },
  history: [createEmptySnapshot()],
  historyIndex: 0,

  addPin: (pin) => set((state) => ({ pins: [...state.pins, pin] })),
  removePin: (pinId) => set((state) => ({ pins: state.pins.filter((pin) => pin.id !== pinId) })),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),

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
        ...applySnapshotState(state, snapshotCopy),
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      }
    }),

  addMarker: (point) => {
    const currentState = get()
    const nextSnapshot = {
      markers: [...currentState.markers, point],
      linePath: currentState.linePath,
      routePaths: currentState.routePaths,
      measurePath: currentState.measurePath,
    }

    currentState.commitSnapshot(nextSnapshot)
  },

  appendLinePoint: (point) => {
    const currentState = get()
    const nextSnapshot = {
      markers: currentState.markers,
      linePath: [...currentState.linePath, point],
      routePaths: currentState.routePaths,
      measurePath: currentState.measurePath,
    }

    currentState.commitSnapshot(nextSnapshot)
  },

  appendMeasurePoint: (point) => {
    const currentState = get()
    const nextSnapshot = {
      markers: currentState.markers,
      linePath: currentState.linePath,
      routePaths: currentState.routePaths,
      measurePath: [...currentState.measurePath, point],
    }

    currentState.commitSnapshot(nextSnapshot)
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
        ...applySnapshotState(state, nextSnapshot),
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
        ...applySnapshotState(state, snapshot),
        historyIndex: nextHistoryIndex,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const nextHistoryIndex = state.historyIndex + 1
      const snapshot = cloneSnapshot(state.history[nextHistoryIndex])

      return {
        ...applySnapshotState(state, snapshot),
        historyIndex: nextHistoryIndex,
      }
    }),
}))

export default useMapStore
