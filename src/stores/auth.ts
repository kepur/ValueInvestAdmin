// src/stores/auth.ts

import api from '@/utils/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router/index'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<string | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const userRoles = ref<string[]>([])

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/login', { username, password })

      if (response.data.access_token && response.data.message.includes('Logged in')) {
        token.value = response.data.access_token
        refreshToken.value = response.data.refresh_token
        user.value = username
        userRoles.value = response.data.roles || []

        localStorage.setItem('token', token.value || '')
        localStorage.setItem('refreshToken', refreshToken.value || '')
        localStorage.setItem('userRoles', JSON.stringify(userRoles.value))

        router.push('/')
      } else {
        throw new Error(response.data.message || 'Login failed, no token returned')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('Login failed')
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (token.value) {
        await api.post(
          '/logout/revoke_access_token',
          {},
          {
            headers: { Authorization: `Bearer ${token.value}` }
          }
        )
      }
      if (refreshToken.value) {
        await api.post(
          '/logout/revoke_refresh_token',
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken.value}` }
          }
        )
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Ensure that clearAuth and redirection are always executed
      clearAuth()
      router.push('/login') // Redirect to login page after logout
    }
  }

  const refreshAccessToken = async (): Promise<void> => {
    try {
      const response = await api.post('/refresh', { refresh_token: refreshToken.value })
      token.value = response.data.access_token
      localStorage.setItem('token', token.value || '')
    } catch (error) {
      console.error('Failed to refresh token:', error)
      throw new Error('Failed to refresh token')
    }
  }

  const loadStoredToken = (): void => {
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUserRoles = localStorage.getItem('userRoles')

    if (storedToken && storedRefreshToken) {
      token.value = storedToken
      refreshToken.value = storedRefreshToken
      userRoles.value = storedUserRoles ? JSON.parse(storedUserRoles) : []
    }
  }

  const clearAuth = (): void => {
    token.value = null
    refreshToken.value = null
    user.value = null
    userRoles.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userRoles')
  }

  const isAuthenticated = (): boolean => !!token.value

  return {
    user,
    token,
    refreshToken,
    userRoles,
    login,
    logout,
    refreshAccessToken,
    loadStoredToken,
    clearAuth,
    isAuthenticated
  }
})
