import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HardDrive, Users, Star, Trash2, ArrowRight } from 'lucide-react'
import { formatFileSize } from '../utils/formatFileSize'
import Loading from '../components/common/Loading'
import { useAuthContext } from '../context/AuthContext'

const QUICK_LINKS = [
  { to: '/drive', label: 'My Drive', icon: HardDrive, desc: 'All your files and folders' },
  { to: '/shared', label: 'Shared with me', icon: Users, desc: 'Files others shared with you' },
  { to: '/starred', label: 'Starred', icon: Star, desc: 'Your favorites, one click away' },
  { to: '/trash', label: 'Trash', icon: Trash2, desc: 'Recently deleted items' },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const { user } = useAuthContext()

  if (!user) return <Loading full />

  const percentUsed = Math.min(
    100,
    (user.storage_used_bytes / user.storage_quota_bytes) * 100
  )

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back{user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening in your Vaulta</p>
      </motion.div>

      {/* Storage card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 rounded-2xl border border-black/5 bg-white p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Storage</p>
          <p className="text-xs text-gray-400">
            {formatFileSize(user.storage_used_bytes)} of {formatFileSize(user.storage_quota_bytes)}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            initial={{ width: 0 }}
            animate={{ width: `${percentUsed}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {QUICK_LINKS.map(({ to, label, icon: Icon, desc }) => (
          <motion.div key={to} variants={cardVariants}>
            <Link
              to={to}
              className="group flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-md hover:shadow-black/5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Icon size={20} className="text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="truncate text-xs text-gray-400">{desc}</p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400"
              />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}