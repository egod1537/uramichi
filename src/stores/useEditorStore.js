import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useEditorStore = create(
  persist(
    (set) => ({
      isShortcutModalOpen: false,
      sidebarOpen: true,
      testbedSelectedComponentKey: null,
      language: 'ko',
      setShortcutModalOpen: (isOpen) => set({ isShortcutModalOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      setTestbedSelectedComponentKey: (componentKey) => set({ testbedSelectedComponentKey: componentKey }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'uramichi-editor-store' },
  ),
)

export default useEditorStore
