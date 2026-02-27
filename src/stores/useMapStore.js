import { create } from 'zustand'

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

const clonePins = (pins) =>
  pins.map((pin) => ({
    ...pin,
    position: pin.position ? { ...pin.position } : pin.position,
    tags: Array.isArray(pin.tags) ? [...pin.tags] : pin.tags,
  }))

const createPinSnapshot = (pins) => ({
  pins: clonePins(pins),
})

const useMapStore = create((set) => ({
  pins: initialPins,
  layers: initialLayers,
  currentMode: 'select',
  mapTitle: '제목없는 지도',
  lastEditedAt: updateTimestamp(),
  selectedPinId: null,
  history: [createPinSnapshot(initialPins)],
  historyIndex: 0,
  addPin: (pin) =>
    set((state) => ({
      pins: [...state.pins, pin],
      history: [
        ...state.history.slice(0, state.historyIndex + 1),
        createPinSnapshot([...state.pins, pin]),
      ],
      historyIndex: state.historyIndex + 1,
      lastEditedAt: updateTimestamp(),
    })),
  removePin: (pinId) =>
    set((state) => {
      const nextPins = state.pins.filter((pin) => pin.id !== pinId)
      const trimmedHistory = state.history.slice(0, state.historyIndex + 1)
      const nextHistory = [...trimmedHistory, createPinSnapshot(nextPins)]

      return {
        pins: nextPins,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
        lastEditedAt: updateTimestamp(),
      }
    }),
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
  setMode: (mode) => set({ currentMode: mode }),
  setMapTitle: (mapTitle) =>
    set({
      mapTitle,
      lastEditedAt: updateTimestamp(),
    }),
  selectPin: (pinId) => set({ selectedPinId: pinId }),
  undo: () =>
    set((state) => {
      if (state.historyIndex === 0) {
        return state
      }

      const nextHistoryIndex = state.historyIndex - 1
      const snapshot = state.history[nextHistoryIndex]
      const restoredPins = clonePins(snapshot.pins)
      const selectedPinExists = restoredPins.some((pin) => pin.id === state.selectedPinId)

      return {
        pins: restoredPins,
        historyIndex: nextHistoryIndex,
        selectedPinId: selectedPinExists ? state.selectedPinId : null,
        lastEditedAt: updateTimestamp(),
      }
    }),
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) {
        return state
      }

      const nextHistoryIndex = state.historyIndex + 1
      const snapshot = state.history[nextHistoryIndex]
      const restoredPins = clonePins(snapshot.pins)
      const selectedPinExists = restoredPins.some((pin) => pin.id === state.selectedPinId)

      return {
        pins: restoredPins,
        historyIndex: nextHistoryIndex,
        selectedPinId: selectedPinExists ? state.selectedPinId : null,
        lastEditedAt: updateTimestamp(),
      }
    }),
}))

export default useMapStore
