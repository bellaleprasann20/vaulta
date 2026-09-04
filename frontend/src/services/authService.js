import api, { setTokens, clearTokens } from './api'

export const authService = {
  async register({ email, password, fullName }) {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    setTokens(data.tokens)
    return data.user
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password })
    setTokens(data.tokens)
    return data.user
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      clearTokens()
    }
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me')
    return data
  },
}

export default authService