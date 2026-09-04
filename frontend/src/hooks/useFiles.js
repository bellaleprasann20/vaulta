import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fileService } from '../services/fileService'
import { starsService } from '../services/starsService'

const folderKey = (folderId) => ['folders', folderId ?? 'root']
const STARS_KEY = ['stars']
const TRASH_KEY = ['trash']

/**
 * Combined starred files+folders listing (GET /stars via starsService).
 * Shares the ['stars'] query key with useToggleFileStar/
 * useToggleFolderStar's invalidation below, so starring/unstarring
 * anywhere in the app automatically refreshes this list — Starred.jsx
 * doesn't need its own manual refetch function anymore.
 */
export function useStarredItems() {
  return useQuery({
    queryKey: STARS_KEY,
    queryFn: starsService.listStarred,
  })
}

/**
 * Individual file lookups (used by Shared.jsx, which only has file_id
 * from a ShareRead and needs the full FileRead).
 */
export function useFile(fileId) {
  return useQuery({
    queryKey: ['files', fileId],
    queryFn: () => fileService.get(fileId),
    enabled: Boolean(fileId),
  })
}

/**
 * Star/unstar a file. Invalidates the parent folder listing (so the
 * star icon updates in place) and the stars listing (so Starred.jsx
 * picks up the add/removal without a manual refresh).
 */
export function useToggleFileStar(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isStarred }) => (isStarred ? fileService.unstar(id) : fileService.star(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
      queryClient.invalidateQueries({ queryKey: STARS_KEY })
    },
  })
}

export function useRenameFile(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }) => fileService.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
    },
  })
}

export function useMoveFile(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, folderId: destFolderId }) => fileService.move(id, destFolderId),
    onSuccess: () => {
      // Both the source folder and destination folder listings are stale.
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useTrashFile(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => fileService.trash(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
      queryClient.invalidateQueries({ queryKey: TRASH_KEY })
      queryClient.invalidateQueries({ queryKey: STARS_KEY }) // a starred file may have just been trashed
    },
  })
}

/**
 * Not a query — a signed download URL is single-use-ish and shouldn't
 * sit in the cache pretending to be reusable data, so this is a plain
 * mutation the caller fires imperatively (e.g. on double-click).
 */
export function useDownloadUrl() {
  return useMutation({
    mutationFn: (fileId) => fileService.getDownloadUrl(fileId),
  })
}

export function useFileVersions(fileId) {
  return useQuery({
    queryKey: ['files', fileId, 'versions'],
    queryFn: () => fileService.listVersions(fileId),
    enabled: Boolean(fileId),
  })
}