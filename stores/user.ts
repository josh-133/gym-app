import { defineStore } from 'pinia'
import type { Profile } from '~/types/database'

interface UserState {
  profile: Profile | null
  isLoading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    profile: null,
    isLoading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.profile,
    displayName: (state) => state.profile?.display_name || state.profile?.username || 'User',
    avatarUrl: (state) => state.profile?.avatar_url,
    unitSystem: (state) => state.profile?.unit_system || 'metric',
  },

  actions: {
    setProfile(profile: Profile | null) {
      this.profile = profile
    },

    updateProfile(updates: Partial<Profile>) {
      if (this.profile) {
        this.profile = { ...this.profile, ...updates }
      }
    },

    clearProfile() {
      this.profile = null
    },
  },
})
