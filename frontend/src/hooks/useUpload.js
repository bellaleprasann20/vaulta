import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fileService } from '../services/fileService'

const folderKey = (folderId) => ['folders', folderId ?? 'root']

/**
 * Deliberately NOT a useMutation — a single mutation models one in-flight
 * request, but this needs several files uploading concurrently with
 * independent progress bars (what UploadProgress.jsx renders). Local
 * state tracks the list; React Query is still used underneath for the
 * one thing it's actually for here — invalidating the folder's cached
 * contents once each upload completes, so the new file appears without
 * a manual refetch.
 */
export function useUpload(folderId) {
  const queryClient = useQueryClient()
  const [uploads, setUploads] = useState([])

  const uploadFiles = useCallback(
    (fileList) => {
      const newUploads = Array.from(fileList).map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size_bytes: file.size,
        progress: 0,
        status: 'uploading',
        file,
      }))
      setUploads((prev) => [...prev, ...newUploads])

      newUploads.forEach((upload) => {
        fileService
          .upload({
            file: upload.file,
            folderId: folderId || null,
            onProgress: (pct) => {
              setUploads((prev) =>
                prev.map((u) => (u.id === upload.id ? { ...u, progress: pct } : u))
              )
            },
          })
          .then(() => {
            setUploads((prev) =>
              prev.map((u) => (u.id === upload.id ? { ...u, status: 'done' } : u))
            )
            queryClient.invalidateQueries({ queryKey: folderKey(folderId) })
          })
          .catch((err) => {
            const message =
              err.response?.data?.message || err.response?.data?.detail || err.message
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id ? { ...u, status: 'error', error: message } : u
              )
            )
          })
      })
    },
    [folderId, queryClient]
  )

  const dismiss = useCallback((id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const dismissAll = useCallback(() => setUploads([]), [])

  return { uploads, uploadFiles, dismiss, dismissAll }
}

export default useUpload