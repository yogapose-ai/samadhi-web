import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
const TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // Try to get token from auth store first (if hydrated)
      const authStorage = localStorage.getItem('auth-storage')
      let token = null

      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          token = parsed?.state?.token
        } catch (e) {
          console.error('Failed to parse auth storage:', e)
        }
      }

      // Fallback to direct localStorage token
      if (!token) {
        token = localStorage.getItem('auth-token')
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Add request timestamp for performance monitoring
    ;(config as any).metadata = { startTime: new Date() }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling and performance monitoring
apiClient.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    // Log response time in development
    if (process.env.NODE_ENV === 'development') {
      const endTime = new Date()
      const startTime = (response.config as any).metadata?.startTime
      if (startTime) {
        const duration = endTime.getTime() - startTime.getTime()
        console.log(
          `API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
        )
      }
    }

    return response
  },
  async (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any

      // Handle 401 Unauthorized
      if (status === 401) {
        console.warn('401 Unauthorized:', data?.detail || data?.message || 'Authentication failed')

        // Check if token is invalid
        if (data?.detail === 'Invalid token' && typeof window !== 'undefined') {
          const currentPath = window.location.pathname

          // Protected routes that require authentication
          const protectedRoutes = ['/mypage', '/notifications']
          const isProtectedRoute = protectedRoutes.some((route) => currentPath.startsWith(route))

          if (isProtectedRoute) {
            // Clear all auth data
            localStorage.removeItem('auth-storage')
            localStorage.removeItem('auth-token')

            // Redirect to login
            window.location.href = `/auth/login?from=${encodeURIComponent(currentPath)}`
          }
        }
      }

      // Log other errors in development
      if (process.env.NODE_ENV === 'development') {
        switch (status) {
          case 403:
            console.error('403 Forbidden:', data?.message || 'Permission denied')
            break
          case 404:
            console.error('404 Not Found:', data?.message || 'Resource not found')
            break
          case 429:
            console.error('429 Too Many Requests:', data?.message || 'Rate limit exceeded')
            break
          case 500:
          case 502:
          case 503:
          case 504:
            console.error(`${status} Server Error:`, data?.message || 'Internal server error')
            break
        }
      }
    } else if (error.request) {
      console.error('Network error: No response received')
    } else {
      console.error('Request error:', error.message)
    }

    return Promise.reject(error)
  },
)

export default apiClient
