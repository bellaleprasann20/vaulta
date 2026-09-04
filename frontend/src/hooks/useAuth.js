import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'

const CURRENT_USER_KEY = ['auth', 'me']

/**
 * Wraps authService in React Query. `useCurrentUser` is the query every
 * other auth-aware hook/component reads from (ProtectedRoute, AppShell,
 * Dashboard) — mutations below invalidate or directly seed that cache
 * entry so the whole app stays in sync after login/logout without a
 * second round-trip.
 */
export function useCurrentUser(options = {}) {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authService.getCurrentUser,
    retry: false,
    ...options,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear() // wipe every cached query — nothing should survive a logout
    },
  })
}

/** Convenience bundle for components that want everything at once. */
export function useAuth() {
  const { data: user, isLoading, isError } = useCurrentUser()
  const login = useLogin()
  const register = useRegister()
  const logout = useLogout()

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user) && !isError,
    login,
    register,
    logout,
  }
}

export default useAuth