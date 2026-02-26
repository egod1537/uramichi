import { create } from 'zustand'

const useMapStore = create((set) => ({
  pins: [],
  layers: [],
  currentMode: 'select',
  addPin: (pin) => set((state) => ({ pins: [...state.pins, pin] })),
  removePin: (pinId) =>
    set((state) => ({ pins: state.pins.filter((pin) => pin.id !== pinId) })),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  setMode: (mode) => set({ currentMode: mode }),
}))

export default useMapStore
