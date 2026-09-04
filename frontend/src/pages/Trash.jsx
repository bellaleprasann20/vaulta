import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react'
import { getFileIcon, getFileColors } from '../utils/fileTypes'
import { formatFileSize } from '../utils/formatFileSize'
import Loading from '../components/common/Loading'
import { useTrash, useRestoreFile, useRestoreFolder, useEmptyTrash } from '../hooks/useFolders'

export default function Trash() {
  const { data, isLoading } = useTrash()
  const restoreFile = useRestoreFile()
  const restoreFolder = useRestoreFolder()
  const emptyTrash = useEmptyTrash()
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  if (isLoading) return <Loading full label="Loading trash…" />

  const files = data?.files || []
  const folders = data?.folders || []
  const isEmpty = files.length === 0 && folders.length === 0
  const items = [
    ...folders.map((f) => ({ ...f, __type: 'folder' })),
    ...files.map((f) => ({ ...f, __type: 'file' })),
  ]

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <Trash2 size={18} className="text-gray-400" />
          <h1 className="text-base font-semibold text-gray-900">Trash</h1>
        </motion.div>

        {!isEmpty && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Empty trash
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <Trash2 size={36} className="mb-3 text-gray-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Trash is empty</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/5">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Icon = item.__type === 'file' ? getFileIcon(item.mime_type) : Trash2
              const colors =
                item.__type === 'file'
                  ? getFileColors(item.mime_type)
                  : { bg: 'bg-brand-50', fg: 'text-brand-500' }
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-0 hover:bg-surface-muted"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Icon size={15} className={colors.fg} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-800">{item.name}</p>
                    {item.__type === 'file' && (
                      <p className="text-xs text-gray-400">{formatFileSize(item.size_bytes)}</p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      item.__type === 'file'
                        ? restoreFile.mutate(item.id)
                        : restoreFolder.mutate(item.id)
                    }
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-white"
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {confirmEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmEmpty(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={17} className="text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Empty trash?</p>
                  <p className="mt-1 text-xs text-gray-500">
                    This permanently deletes everything in trash. This can't be undone.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="shrink-0 text-gray-300 hover:text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    emptyTrash.mutate()
                    setConfirmEmpty(false)
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Empty trash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}