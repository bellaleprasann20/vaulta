import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Copy, Check, Lock, Globe, ChevronDown, Trash2 } from 'lucide-react'

const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
]

/**
 * Share dialog for a file OR folder — the backend's Share/LinkShare
 * models both support either target, so this component takes a single
 * `target` prop and doesn't care which kind it is.
 *
 * Props:
 *  - target: { id, name } — the file or folder being shared
 *  - open: bool
 *  - onClose()
 *  - sharedUsers: SharedUserInfo[] — [{ id, email, full_name, avatar_url, role }]
 *  - onInvite(email, role): POST /shares
 *  - onChangeRole(userId, role): PATCH /shares/{id}
 *  - onRevokeUser(userId): DELETE /shares/{id}
 *  - publicLink: LinkShareRead | null — { id, token, has_password, expires_at, is_revoked }
 *  - onCreateLink(): POST /public-links
 *  - onRevokeLink(): DELETE /public-links/{id}
 */
export default function ShareModal({
  target,
  open,
  onClose,
  sharedUsers = [],
  onInvite,
  onChangeRole,
  onRevokeUser,
  publicLink,
  onCreateLink,
  onRevokeLink,
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [copied, setCopied] = useState(false)
  const [inviting, setInviting] = useState(false)

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    try {
      await onInvite?.(email.trim(), role)
      setEmail('')
    } finally {
      setInviting(false)
    }
  }

  function handleCopyLink() {
    if (!publicLink) return
    const url = `${window.location.origin}/share/${publicLink.token}`
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Share</p>
                <p className="truncate text-xs text-gray-500">{target?.name}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {/* Invite by email */}
              <form onSubmit={handleInvite} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Add people by email"
                  className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <RoleSelect value={role} onChange={setRole} />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={inviting || !email.trim()}
                  className="shrink-0 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {inviting ? '…' : 'Invite'}
                </motion.button>
              </form>

              {/* People with access */}
              {sharedUsers.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    People with access
                  </p>
                  <div className="flex flex-col gap-1">
                    <AnimatePresence initial={false}>
                      {sharedUsers.map((u) => (
                        <motion.div
                          key={u.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-3 rounded-lg px-1 py-1.5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (u.full_name || u.email)[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-800">
                              {u.full_name || u.email}
                            </p>
                            {u.full_name && (
                              <p className="truncate text-xs text-gray-400">{u.email}</p>
                            )}
                          </div>
                          <RoleSelect
                            value={u.role}
                            onChange={(newRole) => onChangeRole?.(u.id, newRole)}
                          />
                          <button
                            onClick={() => onRevokeUser?.(u.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Public link */}
              <div className="mt-5 border-t border-black/5 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                    {publicLink ? (
                      <Globe size={16} className="text-brand-500" />
                    ) : (
                      <Link2 size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {publicLink ? 'Anyone with the link' : 'Get a shareable link'}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {publicLink
                        ? publicLink.has_password
                          ? 'Password protected'
                          : 'Anyone can view this file'
                        : 'No one else can access it yet'}
                    </p>
                  </div>

                  {!publicLink ? (
                    <button
                      onClick={onCreateLink}
                      className="shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-surface-muted"
                    >
                      Create link
                    </button>
                  ) : (
                    <button
                      onClick={onRevokeLink}
                      className="shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {publicLink && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="mt-3 flex items-center gap-2 overflow-hidden rounded-lg bg-surface-muted px-3 py-2"
                    >
                      {publicLink.has_password && (
                        <Lock size={13} className="shrink-0 text-gray-400" />
                      )}
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
                        {window.location.origin}/share/{publicLink.token}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyLink}
                        className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copied ? (
                            <motion.span
                              key="check"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              className="flex items-center gap-1 text-emerald-600"
                            >
                              <Check size={12} /> Copied
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              className="flex items-center gap-1"
                            >
                              <Copy size={12} /> Copy
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Small inline role dropdown shared by the invite form and each shared-user row. */
function RoleSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = ROLES.find((r) => r.value === value) || ROLES[0]

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-surface-muted"
      >
        {current.label}
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full z-20 mt-1 w-28 overflow-hidden rounded-lg border border-black/5 bg-white py-1 shadow-lg shadow-black/10"
            >
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    onChange?.(r.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {r.label}
                  {r.value === value && <Check size={12} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}