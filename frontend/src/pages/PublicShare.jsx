import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Download, AlertCircle, ShieldOff } from 'lucide-react'
import { getFileIcon, getFileColors } from '../utils/fileTypes'
import { formatFileSize } from '../utils/formatFileSize'
import { shareService } from '../services/shareService'

/**
 * No authentication required — this is the Public User access path from
 * the spec, hitting POST /public-links/access/{token} directly.
 */
export default function PublicShare() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'needs-password' | 'ready' | 'error'
  const [fileInfo, setFileInfo] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function attemptAccess(pwd) {
    setSubmitting(true)
    setError(null)
    try {
      const data = await shareService.accessPublicLink(token, pwd || null)
      setFileInfo(data)
      setStatus('ready')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        setStatus('needs-password')
        if (pwd) setError('Incorrect password')
      } else if (status === 404 || status === 410) {
        setStatus('error')
        setError(err.response?.data?.message || err.response?.data?.detail)
      } else {
        setStatus('error')
        setError('Something went wrong loading this link')
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    attemptAccess(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const Icon = fileInfo ? getFileIcon(fileInfo.mime_type) : null
  const colors = fileInfo ? getFileColors(fileInfo.mime_type) : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <div className="h-3.5 w-3.5 rounded-sm bg-white" />
          </div>
          <p className="text-xs font-medium text-gray-400">Shared via Vaulta</p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="mx-auto h-7 w-7 rounded-full border-2 border-brand-100 border-t-brand-600"
              />
            </motion.div>
          )}

          {status === 'needs-password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <Lock size={18} className="text-brand-500" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-800">Password required</p>
              <p className="mb-4 text-xs text-gray-500">
                This link is protected. Enter the password to continue.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  attemptAccess(password)
                }}
                className="flex flex-col gap-2"
              >
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-center text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting || !password}
                  className="mt-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? 'Checking…' : 'Unlock'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {status === 'ready' && fileInfo && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg}`}>
                <Icon size={28} className={colors.fg} strokeWidth={1.6} />
              </div>
              <p className="mb-1 truncate text-sm font-medium text-gray-900">
                {fileInfo.file_name}
              </p>
              <p className="mb-5 text-xs text-gray-400">{formatFileSize(fileInfo.size_bytes)}</p>
              <motion.a
                whileTap={{ scale: 0.98 }}
                href={fileInfo.download_url}
                download
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Download size={15} /> Download
              </motion.a>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <ShieldOff size={18} className="text-red-500" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-800">Link unavailable</p>
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <AlertCircle size={12} />
                {error || 'This link is invalid or has expired'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}