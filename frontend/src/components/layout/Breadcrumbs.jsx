import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Folder path trail. `items` matches the backend's BreadcrumbItem shape
 * exactly (GET /folders/{id} -> breadcrumbs: [{ id, name }]), so this
 * drops in directly against the API response with no reshaping.
 *
 * Props:
 *  - items: [{ id, name }] — root "My Drive" is rendered separately,
 *    pass only the folders below it.
 */
export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1 text-sm">
      <Link
        to="/drive"
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
      >
        <Home size={14} />
        <span className={items.length === 0 ? 'font-medium text-gray-900' : ''}>
          My Drive
        </span>
      </Link>

      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex shrink-0 items-center gap-1"
            >
              <ChevronRight size={14} className="text-gray-300" />
              {isLast ? (
                <span className="rounded-md px-2 py-1 font-medium text-gray-900">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={`/drive/${item.id}`}
                  className="rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
                >
                  {item.name}
                </Link>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </nav>
  )
}