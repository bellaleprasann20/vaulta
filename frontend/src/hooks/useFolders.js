import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { folderService } from '../services/folderService'

const folderKey = (folderId) => ['folders', folderId ?? 'root']
const TRASH_KEY = ['trash']

/**
 * Contents of a single folder (or root, when folderId is null/undefined).
 * Matches the backend's FolderContents shape directly:
 * { folder, breadcrumbs, subfolders, files }.
 */
export function useFolderContents(folderId) {
  return useQuery({
    queryKey: folderKey(folderId),
    queryFn: () =>
      folderId ? folderService.getContents(folderId) : folderService.getRootContents(),
  })
}

export function useCreateFolder(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, parentId = folderId ?? null }) =>
      folderService.create({ name, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
    },
  })
}

export function useRenameFolder(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }) => folderService.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
    },
  })
}

export function useMoveFolder(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, parentId }) => folderService.move(id, parentId),
    onSuccess: () => {
      // Both the source and destination listings are now stale.
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useToggleFolderStar(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isStarred }) =>
      isStarred ? folderService.unstar(id) : folderService.star(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
      queryClient.invalidateQueries({ queryKey: ['stars'] })
    },
  })
}

export function useTrashFolder(folderId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => folderService.trash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
      queryClient.invalidateQueries({ queryKey: TRASH_KEY })
      queryClient.invalidateQueries({ queryKey: ['stars'] }) // a starred folder may have just been trashed
    },
  })
}

// ---------------------------------------------------------------------------
// Trash
// ---------------------------------------------------------------------------

export function useTrash() {
  return useQuery({
    queryKey: TRASH_KEY,
    queryFn: folderService.listTrash,
  })
}

export function useRestoreFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => folderService.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEY })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useRestoreFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (folderId) => folderService.restoreFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEY })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useEmptyTrash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: folderService.emptyTrash,
    onSuccess: () => {
      queryClient.setQueryData(TRASH_KEY, { files: [], folders: [] })
    },
  })
}

export default useFolderContents