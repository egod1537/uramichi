import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LOCAL_STORAGE_KEYS } from '../utils/config';

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
      setTestbedSelectedComponentKey: (componentKey) =>
        set({ testbedSelectedComponentKey: componentKey }),
      setLanguage: (language) => set({ language }),
    }),
    { name: LOCAL_STORAGE_KEYS.editorStore },
  ),
);

export default useEditorStore;
