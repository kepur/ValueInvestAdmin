import api from '@/utils/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<string | null>(null)
  const token = ref<string | null>(null) // 确保 token 的类型为 string | null
  const refreshToken = ref<string | null>(null)
  // 用户登录
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/login', { username, password })

      // 检查是否返回了 access_token
      if (response.data.access_token && response.data.message.includes('Logged in')) {
        // 保存 access_token, refresh_token 和 用户名
        token.value = response.data.access_token
        refreshToken.value = response.data.refresh_token
        user.value = username

        // 将 token 存储到 localStorage 中
        localStorage.setItem('token', token.value || '')
        localStorage.setItem('refreshToken', refreshToken.value || '')
      } else {
        // 如果没有返回 token 或者 message 不正确，抛出错误
        throw new Error(response.data.message || '登录失败，未返回 token')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error('登录失败')
    }
  }
  // 用户注销
  const logout = async (): Promise<void> => {
    try {
      console.log('访问token:' + token.value)
      // 使用访问 token 注销访问 token
      const access_headers = {
        // 'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      }
      console.log(access_headers)
      await api.post(
        '/logout/revoke_access_token',
        {},
        {
          headers: access_headers
        }
      )

      console.log('刷新token:' + refreshToken.value)
      // 使用刷新 token 注销刷新 token
      const refresh_headers = {
        // 'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken.value}`
      }
      console.log(refresh_headers)
      await api.post(
        '/logout/revoke_refresh_token',
        {},
        {
          headers: refresh_headers // 传递 headers
        }
      )

      console.log('注销成功')
      clearAuth()
    } catch (error) {
      console.error('注销失败:', error)
    }
  }
  // 刷新 token
  const refreshAccessToken = async (): Promise<void> => {
    try {
      const response = await api.post('/refresh')
      token.value = response.data.access_token
      localStorage.setItem('token', token.value || '')
    } catch (error) {
      console.error('刷新 token 失败:', error)
      throw new Error('刷新 token 失败')
    }
  }
  // 从本地存储加载 token
  const loadStoredToken = (): void => {
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (storedToken && storedRefreshToken) {
      token.value = storedToken
      refreshToken.value = storedRefreshToken
    }
  }
  // 清除 token 和用户信息
  const clearAuth = (): void => {
    token.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
  const isAuthenticated = (): boolean => !!token.value
  return {
    user,
    token,
    refreshToken,
    login,
    logout,
    refreshAccessToken,
    loadStoredToken,
    clearAuth,
    isAuthenticated
  }
})
