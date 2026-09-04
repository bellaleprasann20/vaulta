import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { formatFileSize } from '../../utils/formatFileSize'
import { getFileIcon, getFileColors } from '../../utils/fileTypes'
import ItemMenu from '../common/ItemMenu'

/**
 * Single file tile for the grid view. Matches the backend's FileRead
 * schema directly: { id, name, mime_type, size_bytes, is_starred, ... }
 *
 * Props:
 *  - file: FileRead
 *  - onOpen(file): double-click / open preview
 *  - onToggleStar(file): POST/DELETE /files/{id}/star
 *  - onShare(file): opens ShareModal for this file
 *  - onDelete(file): moves this file to trash
 *  - selected: bool — for multi-select grids
 */
export default function FileCard({ file, onOpen, onToggleStar, onShare, onDelete, selected = false }) {
  const Icon = getFileIcon(file.mime_type)
  const colors = getFileColors(file.mime_type)
  const isImage = file.mime_type?.startsWith('image/') && file.thumbnail_url

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onDoubleClick={() => onOpen?.(file)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md hover:shadow-black/5 ${
        selected ? 'border-brand-400 ring-2 ring-brand-100' : 'border-black/5'
      }`}
    >
      {/* Thumbnail / icon area */}
      <div className={`flex h-28 items-center justify-center ${isImage ? '' : colors.bg}`}>
        {isImage ? (
          <img src={file.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon size={34} className={colors.fg} strokeWidth={1.6} />
        )}
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-400">{formatFileSize(file.size_bytes)}</p>
        </div>
      </div>

      {/* Hover-revealed actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar?.(file)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white"
        >
          <Star
            size={14}
            className={file.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}
          />
        </motion.button>
        <ItemMenu onShare={() => onShare?.(file)} onDelete={() => onDelete?.(file)} />
      </div>

      {/* Persistent star badge (visible even without hover, if starred) */}
      {file.is_starred && (
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-100 backdrop-blur-sm group-hover:opacity-0">
          <Star size={14} className="fill-amber-400 text-amber-400" />
        </div>
      )}
    </motion.div>
  )
}