import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Share2, Trash2 } from 'lucide-react'

/**
 * Addition — not in your original component tree, but FileCard and
 * FolderCard both had a "•••" button wired to an `onMenu` prop that
 * every page left as a no-op (`() => {}`), so there was never an actual
 * way to delete anything except from the Trash page's restore flow.
 * This is the actual dropdown, shared by both cards so the menu itself
 * only needs to be built once.
 *
 * Props:
 *  - onShare(): opens ShareModal for this item
 *  - onDelete(): moves this item to trash
 */
export default function ItemMenu({ onShare, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white"
      >
        <MoreVertical size={14} className="text-gray-500" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg shadow-black/10"
          >
            <button
              onClick={() => {
                setOpen(false)
                onShare?.()
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-surface-muted"
            >
              <Share2 size={14} className="text-gray-400" />
              Share
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onDelete?.()
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}