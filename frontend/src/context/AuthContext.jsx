import { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Thin Provider around hooks/useAuth.js. Worth being upfront about why
 * this exists alongside a hook that already reads from React Query's
 * cache: React Query dedupes the underlying network request regardless
 * of how many components call useCurrentUser(), so this Context isn't
 * solving a request-waterfall problem. What it does give you is a
 * single, explicit place components import auth state from (useAuthContext())
 * instead of each one importing the hook bundle directly — and it's a
 * clean seam if auth state ever needs to include something that isn't
 * server data (e.g. a client-only "just registered" flag).
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an <AuthProvider>')
  }
  return ctx
}

export default AuthContext