import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Star, Share2 } from 'lucide-react'
import { formatFileSize } from '../../utils/formatFileSize'
import { getFileIcon, getFileColors, isPreviewable } from '../../utils/fileTypes'

/**
 * Full-screen preview modal. `previewUrl` is expected to come from
 * GET /files/{id}/download (a short-lived signed URL) — this component
 * doesn't fetch it itself, so the caller controls when that call fires.
 *
 * Props:
 *  - file: FileRead | null — null/undefined means closed
 *  - previewUrl: string | null — signed download URL, once loaded
 *  - onClose(): close the modal
 *  - onDownload(file), onToggleStar(file), onShare(file)
 */
export default function FilePreview({ file, previewUrl, onClose, onDownload, onToggleStar, onShare }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const open = Boolean(file)
  const Icon = file ? getFileIcon(file.mime_type) : null
  const colors = file ? getFileColors(file.mime_type) : null
  const previewable = file ? isPreviewable(file.mime_type) : false
  const isImage = file?.mime_type?.startsWith('image/')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-3.5">
              <p className="truncate text-sm font-medium text-gray-800">{file?.name}</p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onToggleStar?.(file)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Star
                    size={16}
                    className={file?.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}
                  />
                </button>
                <button
                  onClick={() => onShare?.(file)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Share2 size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => onDownload?.(file)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Download size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-surface-muted p-6">
              {!previewable && Icon && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${colors.bg}`}>
                    <Icon size={36} className={colors.fg} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-gray-500">No preview available for this file type</p>
                  {file && (
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size_bytes)} · {file.mime_type}
                    </p>
                  )}
                </div>
              )}

              {previewable && !previewUrl && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="text-sm text-gray-400"
                >
                  Loading preview…
                </motion.div>
              )}

              {previewable && previewUrl && isImage && (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-sm"
                />
              )}

              {previewable && previewUrl && file?.mime_type === 'application/pdf' && (
                <iframe
                  title={file.name}
                  src={previewUrl}
                  className="h-[65vh] w-full rounded-lg border border-black/5 bg-white"
                />
              )}

              {previewable && previewUrl && file?.mime_type?.startsWith('text/') && (
                <iframe
                  title={file.name}
                  src={previewUrl}
                  className="h-[65vh] w-full rounded-lg border border-black/5 bg-white"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}