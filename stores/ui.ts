import { defineStore } from 'pinia'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  mobileMenuOpen: boolean
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    theme: 'system',
    sidebarOpen: true,
    mobileMenuOpen: false,
  }),

  getters: {
    isDarkMode: (state) => {
      if (state.theme === 'system') {
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
      }
      return state.theme === 'dark'
    },
  },

  actions: {
    setTheme(theme: Theme) {
      this.theme = theme
      this.applyTheme()
    },

    toggleTheme() {
      const themes: Theme[] = ['light', 'dark', 'system']
      const currentIndex = themes.indexOf(this.theme)
      this.theme = themes[(currentIndex + 1) % themes.length]
      this.applyTheme()
    },

    applyTheme() {
      if (typeof document === 'undefined') return

      const isDark = this.isDarkMode
      document.documentElement.classList.toggle('dark', isDark)
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    setSidebarOpen(open: boolean) {
      this.sidebarOpen = open
    },

    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },

    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
  },
})
