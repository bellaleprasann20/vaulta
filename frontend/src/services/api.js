/**
 * Axios instance — supersedes the temporary src/lib/api.js from the
 * pages/ batch (flagged at the time as likely to be replaced once this
 * folder arrived). Every service file in this folder imports `api` from
 * here instead of hand-rolling fetch calls.
 *
 * Handles two things the plain fetch wrapper didn't:
 *  1. Automatic Bearer header injection from localStorage.
 *  2. Automatic access-token refresh on a 401 — queues concurrent
 *     requests that fail while a refresh is already in flight, so a
 *     page that fires five requests at once doesn't trigger five
 *     separate refresh calls.
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const ACCESS_TOKEN_KEY = 'vaulta_access_token'
const REFRESH_TOKEN_KEY = 'vaulta_refresh_token'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // also send the HttpOnly cookie main.py sets
})

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ---------------------------------------------------------------------------
// Request interceptor — attach the access token
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — refresh once on 401, replay the original request
// ---------------------------------------------------------------------------

let isRefreshing = false
let pendingQueue = []

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Don't try to refresh on the refresh/login endpoints themselves —
    // that would loop forever once refresh_token is also invalid.
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // A refresh is already in flight — wait for it instead of firing
        // a second one, then replay this request with the new token.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        if (!refreshToken) throw new Error('No refresh token available')

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        setTokens(data)
        flushQueue(null, data.access_token)

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        flushQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api