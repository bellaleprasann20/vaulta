import { useQuery } from '@tanstack/react-query'
import { searchService } from '../services/searchService'

/**
 * GET /search — disabled (no request fired) until there's a non-empty
 * query, so Search.jsx doesn't hit the backend on every keystroke of an
 * empty box or on first mount before the user has typed anything.
 */
export function useSearch(query, { fileType = null } = {}) {
  const trimmed = query?.trim() || ''

  return useQuery({
    queryKey: ['search', trimmed, fileType],
    queryFn: () => searchService.search(trimmed, { fileType }),
    enabled: trimmed.length > 0,
  })
}

export default useSearch