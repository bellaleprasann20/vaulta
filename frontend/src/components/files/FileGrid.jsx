import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import FileCard from './FileCard'

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.035 },
  },
}

/**
 * Responsive grid of FileCards. Wraps children in AnimatePresence so
 * deleting/moving a file animates it out instead of popping away, and
 * a fresh folder's files stagger in on first render.
 *
 * Props:
 *  - files: FileRead[]
 *  - selectedIds: Set<string> — for multi-select
 *  - onOpen, onToggleStar, onShare, onDelete, onSelect: passed through to FileCard
 */
export default function FileGrid({
  files = [],
  selectedIds = new Set(),
  onOpen,
  onToggleStar,
  onShare,
  onDelete,
}) {
  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 text-center"
      >
        <FolderOpen size={40} className="mb-3 text-gray-300" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-500">This folder is empty</p>
        <p className="mt-1 text-xs text-gray-400">
          Drag files here or use the New button to add something
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            selected={selectedIds.has(file.id)}
            onOpen={onOpen}
            onToggleStar={onToggleStar}
            onShare={onShare}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}