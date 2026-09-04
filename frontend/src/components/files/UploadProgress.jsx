import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X, ChevronDown, File as FileIcon } from 'lucide-react'
import { useState } from 'react'
import { formatFileSize } from '../../utils/formatFileSize'

/**
 * Floating bottom-right panel listing in-flight uploads — the visual
 * counterpart to the backend's init-upload -> PUT -> complete-upload
 * flow. The caller owns upload state; this just renders it.
 *
 * Props:
 *  - uploads: Array<{
 *      id: string,
 *      name: string,
 *      size_bytes: number,
 *      progress: number,       // 0-100
 *      status: 'uploading' | 'done' | 'error',
 *      error?: string,
 *    }>
 *  - onDismiss(id): remove one entry (e.g. after it's done)
 *  - onDismissAll(): clear the whole panel
 */
export default function UploadProgress({ uploads = [], onDismiss, onDismissAll }) {
  const [collapsed, setCollapsed] = useState(false)

  if (uploads.length === 0) return null

  const activeCount = uploads.filter((u) => u.status === 'uploading').length
  const doneCount = uploads.filter((u) => u.status === 'done').length

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:bottom-5 sm:left-auto sm:right-5 sm:w-80">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl shadow-black/10"
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between gap-3 border-b border-black/5 px-4 py-3"
        >
          <p className="text-sm font-medium text-gray-800">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}…`
              : `${doneCount} upload${doneCount > 1 ? 's' : ''} complete`}
          </p>
          <div className="flex items-center gap-1">
            <span
              onClick={(e) => {
                e.stopPropagation()
                onDismissAll?.()
              }}
              className="rounded-md px-1.5 py-0.5 text-xs text-gray-400 hover:bg-black/5 hover:text-gray-600"
            >
              Clear
            </span>
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronDown size={16} className="text-gray-400" />
            </motion.div>
          </div>
        </button>

        {/* List */}
        <motion.div
          animate={{ height: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="scrollbar-thin max-h-64 overflow-y-auto">
            <AnimatePresence initial={false}>
              {uploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-3 border-b border-black/5 px-4 py-3 last:border-0"
                >
                  <div className="mt-0.5 shrink-0">
                    {upload.status === 'done' && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                    {upload.status === 'error' && (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    {upload.status === 'uploading' && (
                      <FileIcon size={16} className="text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700">{upload.name}</p>

                    {upload.status === 'uploading' && (
                      <>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/5">
                          <motion.div
                            className="h-full rounded-full bg-brand-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${upload.progress}%` }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {upload.progress}% · {formatFileSize(upload.size_bytes)}
                        </p>
                      </>
                    )}

                    {upload.status === 'done' && (
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {formatFileSize(upload.size_bytes)} · Complete
                      </p>
                    )}

                    {upload.status === 'error' && (
                      <p className="mt-0.5 text-[11px] text-red-500">
                        {upload.error || 'Upload failed'}
                      </p>
                    )}
                  </div>

                  {upload.status !== 'uploading' && (
                    <button
                      onClick={() => onDismiss?.(upload.id)}
                      className="shrink-0 rounded-full p-1 text-gray-300 hover:bg-black/5 hover:text-gray-500"
                    >
                      <X size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}