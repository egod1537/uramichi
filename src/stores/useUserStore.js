import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      currentUser: null,
      isLoggedIn: false,
      displayName: '',
      email: '',
      avatarUrl: '',
      projects: [],
      login: (userData) =>
        set({
          currentUser: userData,
          isLoggedIn: true,
          displayName: userData?.displayName || '',
          email: userData?.email || '',
          avatarUrl: userData?.avatarUrl || '',
        }),
      logout: () =>
        set({
          currentUser: null,
          isLoggedIn: false,
          displayName: '',
          email: '',
          avatarUrl: '',
        }),
      setProjects: (projects) => set({ projects }),
    }),
    {
      name: 'uramichi-user-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isLoggedIn: state.isLoggedIn,
        displayName: state.displayName,
        email: state.email,
        avatarUrl: state.avatarUrl,
      }),
    },
  ),
)

export default useUserStore
