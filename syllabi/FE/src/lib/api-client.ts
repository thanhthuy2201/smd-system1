import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

/**
 * API Client Configuration
 *
 * This module provides a centralized Axios instance for making HTTP requests
 * to the backend API. It includes:
 * - Base URL configuration from environment variables
 * - Request/response interceptors for authentication and error handling
 * - Type-safe wrapper methods for common HTTP operations
 */

// Get API base URL from environment variable
// Default to localhost:3000 if not set
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Create Axios instance with default configuration
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request Interceptor
 * Adds authentication token to all requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from cookie (set by auth store)
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('firebase_auth_token='))
      ?.split('=')[1]

    if (cookieToken) {
      try {
        // Parse the JSON-encoded token from cookie
        const token = JSON.parse(decodeURIComponent(cookieToken))
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error(
          '[API Client] Failed to parse auth token from cookie:',
          error
        )
      }
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          params: config.params,
          data: config.data,
        }
      )
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * API Error Interface
 * Standardized error response format from the backend
 */
export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
  path: string
  details?: Array<{ field: string; message: string }>
}

/**
 * Error Logger
 * Logs errors with consistent format including timestamp, endpoint, and error details
 */
function logError(error: any, context: string = 'API') {
  const timestamp = new Date().toISOString()
  const endpoint = error.config?.url || 'unknown'
  const method = error.config?.method?.toUpperCase() || 'unknown'
  const status = error.response?.status || 'N/A'
  const message = error.response?.data?.message || error.message || 'Unknown error'

  console.error(`[${context} Error] ${timestamp}`, {
    endpoint: `${method} ${endpoint}`,
    status,
    message,
    details: error.response?.data?.details,
    fullError: import.meta.env.DEV ? error : undefined,
  })
}

/**
 * Get User-Friendly Error Message
 * Maps HTTP status codes to user-friendly messages
 */
function getUserFriendlyMessage(status: number, data?: ApiError): string {
  switch (status) {
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return data?.message || 'This action conflicts with the current state. Please refresh and try again.'
    case 422:
      return 'Please check your input and try again.'
    case 500:
    case 502:
    case 503:
      return 'A server error occurred. Please try again later.'
    default:
      return data?.message || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Response Interceptor
 * Handles common response scenarios and errors
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      )
    }

    return response
  },
  (error) => {
    // Log error with detailed information
    logError(error)

    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response
      const userMessage = getUserFriendlyMessage(status, data)

      // Attach user-friendly message to error object
      error.userMessage = userMessage

      switch (status) {
        case 401:
          // Unauthorized - invalid or expired token
          console.error('Authentication required - redirecting to login')
          // Clear auth cookies
          document.cookie =
            'firebase_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          // Redirect to login page
          window.location.href = '/sign-in'
          break

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access denied:', userMessage)
          break

        case 404:
          // Not found - resource doesn't exist
          console.error('Resource not found:', error.config?.url)
          break

        case 409:
          // Conflict - operation conflicts with current state
          console.error('Conflict error:', data?.message)
          break

        case 422:
          // Validation error - detailed field errors available
          console.error('Validation error:', data?.details)
          // Attach validation details for form handling
          error.validationErrors = data?.details
          break

        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error:', status)
          break

        default:
          console.error('API error:', status, userMessage)
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network error - no response received')
      error.userMessage = 'Network error. Please check your connection and try again.'
    } else {
      // Something else happened during request setup
      console.error('Request setup error:', error.message)
      error.userMessage = 'Failed to send request. Please try again.'
    }

    return Promise.reject(error)
  }
)

/**
 * API Client Interface
 * Provides type-safe methods for making HTTP requests
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, config)
  },

  /**
   * POST request
   */
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, data, config)
  },

  /**
   * PUT request
   */
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.put<T>(url, data, config)
  },

  /**
   * PATCH request
   */
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch<T>(url, data, config)
  },

  /**
   * DELETE request
   */
  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete<T>(url, config)
  },

  /**
   * Upload file(s)
   */
  upload: <T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
  },

  /**
   * Download file
   */
  download: (
    url: string,
    filename: string,
    config?: AxiosRequestConfig
  ): Promise<void> => {
    return axiosInstance
      .get(url, {
        ...config,
        responseType: 'blob',
      })
      .then((response) => {
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      })
  },
}

/**
 * Export the axios instance for advanced use cases
 */
export { axiosInstance }

/**
 * Export base URL for reference
 */
export { API_BASE_URL }
