import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50"
      >
        <FileQuestion size={30} className="text-brand-500" strokeWidth={1.6} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-semibold text-gray-900"
      >
        Page not found
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-2 max-w-xs text-sm text-gray-500"
      >
        The page you're looking for doesn't exist or may have been moved.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          to="/drive"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <ArrowLeft size={15} />
          Back to My Drive
        </Link>
      </motion.div>
    </div>
  )
}