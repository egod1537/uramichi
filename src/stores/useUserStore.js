import { create } from 'zustand'

const useUserStore = create((set) => ({
  currentUser: null,
  isLoggedIn: false,
  projects: [],
  login: (userData) => set({ currentUser: userData, isLoggedIn: true }),
  logout: () => set({ currentUser: null, isLoggedIn: false }),
  setProjects: (projects) => set({ projects }),
}))

export default useUserStore
