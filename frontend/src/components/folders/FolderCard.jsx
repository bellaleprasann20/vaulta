import { useState } from 'react'
import { motion } from 'framer-motion'
import { Folder, Star } from 'lucide-react'
import ItemMenu from '../common/ItemMenu'

/**
 * Folder tile for the grid view. Matches the backend's FolderRead
 * schema: { id, name, owner_id, parent_id, is_starred, is_trashed, ... }
 *
 * Doubles as a drop target — dragging a FileCard over it highlights the
 * folder (visual only here; the actual move happens via PATCH
 * /files/{id} with the new folder_id, wired by the parent page).
 *
 * Props:
 *  - folder: FolderRead
 *  - onOpen(folder): navigate into it
 *  - onToggleStar(folder): POST/DELETE /stars/folders/{id}
 *  - onShare(folder): opens ShareModal for this folder
 *  - onDelete(folder): moves this folder to trash
 *  - onDropFile(folder, dataTransfer): a FileCard was dropped here
 */
export default function FolderCard({ folder, onOpen, onToggleStar, onShare, onDelete, onDropFile }) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragOver ? 1.03 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onDoubleClick={() => onOpen?.(folder)}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        onDropFile?.(folder, e.dataTransfer)
      }}
      className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-shadow hover:shadow-md hover:shadow-black/5 ${
        isDragOver ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-200' : 'border-black/5'
      }`}
    >
      <motion.div
        animate={{ rotate: isDragOver ? -6 : 0, scale: isDragOver ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50"
      >
        <Folder size={18} className="fill-brand-100 text-brand-500" strokeWidth={1.8} />
      </motion.div>

      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800" title={folder.name}>
        {folder.name}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar?.(folder)
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:bg-black/5 ${
            folder.is_starred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star
            size={14}
            className={folder.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}
          />
        </motion.button>
        <ItemMenu onShare={() => onShare?.(folder)} onDelete={() => onDelete?.(folder)} />
      </div>
    </motion.div>
  )
}