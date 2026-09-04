import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '../../hooks/useAuth'
import Loading from './Loading'

/**
 * Addition — not in your original tree, but Dashboard/MyDrive/Shared/
 * Starred/Trash/Search all need to redirect to /login when there's no
 * valid session, so this exists to unblock them.
 *
 * Verifies the session by calling GET /auth/me (via useCurrentUser)
 * rather than just trusting a token sitting in localStorage — a token
 * can be present but expired or revoked, and only the backend actually
 * knows.
 */
export default function ProtectedRoute() {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) return <Loading full />
  if (isError || !user) return <Navigate to="/login" replace />
  return <Outlet />
}