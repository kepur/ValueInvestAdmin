import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { baseURL_dev } from '@/config/baseConfig'
import router from '@/router' 

const api = axios.create({
  baseURL: baseURL_dev 
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  const { token } = storeToRefs(authStore)

  if (!config.headers.Authorization && token.value && typeof token.value === 'string') {
    config.headers.Authorization = `Bearer ${token.value}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const authStore = useAuthStore()
    const { clearAuth } = authStore

    if (error.response && error.response.status === 401) {
      clearAuth()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default api
