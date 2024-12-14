// src/services/api.ts
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia' // 引入 storeToRefs
import { baseURL_dev } from '@/config/baseURL'

const api = axios.create({
  baseURL: baseURL_dev // 基础 API 地址
})

// 请求拦截器，自动添加 JWT token 到请求头
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  const { token } = storeToRefs(authStore) // 使用 storeToRefs 解构 token

  // 如果请求中没有自定义 Authorization 头，则自动添加访问 token
  if (!config.headers.Authorization && token.value && typeof token.value === 'string') {
    config.headers.Authorization = `Bearer ${token.value}`
  }
  return config
})
export default api
