import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ArrowUp, FolderOpen } from 'lucide-react'
import { formatFileSize } from '../../utils/formatFileSize'
import { getFileIcon, getFileColors } from '../../utils/fileTypes'
import { formatDate } from '../../utils/formatDate'
import ItemMenu from '../common/ItemMenu'

const COLUMNS = [
  { key: 'name', label: 'Name', className: 'flex-1' },
  { key: 'size_bytes', label: 'Size', className: 'w-24 text-right' },
  { key: 'updated_at', label: 'Modified', className: 'w-40' },
]

/**
 * Row-based alternative to FileGrid — same data shape, same callbacks.
 * Sortable by clicking a column header; the sort arrow flips with a
 * small spring rotation rather than an instant swap.
 */
export default function FileList({ files = [], onOpen, onToggleStar, onShare, onDelete }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...files].sort((a, b) => {
    let av = a[sortKey]
    let bv = b[sortKey]
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 text-center">
        <FolderOpen size={40} className="mb-3 text-gray-300" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-500">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/5">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-black/5 bg-surface-muted px-4 py-2.5">
        <div className="w-8" /> {/* icon column spacer */}
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 ${col.className}`}
          >
            {col.label}
            {sortKey === col.key && (
              <motion.span
                initial={{ rotate: sortDir === 'asc' ? 180 : 0 }}
                animate={{ rotate: sortDir === 'asc' ? 0 : 180 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <ArrowUp size={12} />
              </motion.span>
            )}
          </button>
        ))}
        <div className="w-16" /> {/* actions column spacer */}
      </div>

      {/* Rows */}
      <AnimatePresence initial={false} mode="popLayout">
        {sorted.map((file) => {
          const Icon = getFileIcon(file.mime_type)
          const colors = getFileColors(file.mime_type)
          return (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              onDoubleClick={() => onOpen?.(file)}
              className="group flex cursor-pointer items-center gap-4 border-b border-black/5 px-4 py-2.5 last:border-0 hover:bg-surface-muted"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                <Icon size={15} className={colors.fg} />
              </div>

              <p className="flex-1 truncate text-sm text-gray-800">{file.name}</p>
              <p className="w-24 text-right text-xs text-gray-400">
                {formatFileSize(file.size_bytes)}
              </p>
              <p className="w-40 text-xs text-gray-400">{formatDate(file.updated_at)}</p>

              <div className="flex w-16 shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleStar?.(file)
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Star
                    size={14}
                    className={file.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}
                  />
                </button>
                <ItemMenu onShare={() => onShare?.(file)} onDelete={() => onDelete?.(file)} />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}