import { create } from 'zustand'

const useUserStore = create((set) => ({
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
}))

export default useUserStore
