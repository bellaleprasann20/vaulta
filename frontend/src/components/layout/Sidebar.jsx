import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardDrive, Users, Star, Trash2, Plus, FolderPlus, UploadCloud,
  ScanLine, Camera, X,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { formatFileSize } from '../../utils/formatFileSize'

const NAV_ITEMS = [
  { to: '/drive', label: 'My Drive', icon: HardDrive },
  { to: '/shared', label: 'Shared with me', icon: Users },
  { to: '/starred', label: 'Starred', icon: Star },
  { to: '/trash', label: 'Trash', icon: Trash2 },
]

// docs.new / sheets.new / slides.new are Google's own official shortcut
// domains — they open a blank file in the signed-in user's OWN Google
// Drive. This is a convenience link, not an integration: the resulting
// doc does NOT get saved into Vaulta. A real "create inside Vaulta"
// version would need Google OAuth + Drive API wiring on the backend.
const GOOGLE_SHORTCUTS = [
  { label: 'Google Docs', url: 'https://docs.new', color: 'text-blue-500' },
  { label: 'Google Sheets', url: 'https://sheets.new', color: 'text-green-600' },
  { label: 'Google Slides', url: 'https://slides.new', color: 'text-amber-500' },
]

/**
 * Left navigation. Uses a single `layoutId`-animated pill (Framer Motion)
 * that glides between nav items on route change, rather than each link
 * independently fading its own background in/out.
 *
 * Mobile: renders as an off-canvas drawer (fixed, slides in from the
 * left with a backdrop) controlled by `mobileOpen`/`onMobileClose`.
 * Desktop (md+): those props are ignored — the sidebar is always
 * visible, participating in the normal flex layout.
 *
 * Props:
 *  - storageUsedBytes, storageQuotaBytes: from GET /users/me/storage
 *  - onCreateFolder, onUploadFile: callbacks wired to the New menu
 *  - onCapture(file): a photo was taken via Scan or Camera
 *  - mobileOpen, onMobileClose: drawer state, owned by AppShell
 */
export default function Sidebar({
  storageUsedBytes = 0,
  storageQuotaBytes = 15 * 1024 * 1024 * 1024,
  onCreateFolder,
  onUploadFile,
  onCapture,
  mobileOpen = false,
  onMobileClose,
}) {
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const percentUsed = Math.min(100, (storageUsedBytes / storageQuotaBytes) * 100)
  const scanInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  function closeMenu() {
    setNewMenuOpen(false)
  }

  function handleCaptureChange(e) {
    const file = e.target.files?.[0]
    if (file) onCapture?.(file)
    e.target.value = '' // allow capturing the same shot again later
    closeMenu()
  }

  return (
    <>
      {/* Backdrop — mobile only, shown while the drawer is open */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-black/5 bg-white px-3 py-4 transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile-only close button */}
        <button
          onClick={onMobileClose}
          className="mb-2 flex h-8 w-8 items-center justify-center self-end rounded-full text-gray-400 hover:bg-black/5 md:hidden"
        >
          <X size={16} />
        </button>

        {/* Hidden inputs powering Scan / Camera — `capture` opens the
            device camera directly on mobile browsers that support it;
            on desktop it just falls back to a normal file picker. */}
        <input
          ref={scanInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCaptureChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleCaptureChange}
        />

        {/* New button + dropdown */}
        <div className="relative mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setNewMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
          >
            <Plus size={18} strokeWidth={2.5} />
            New
          </motion.button>

          <AnimatePresence>
            {newMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeMenu} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-black/5 bg-white py-1.5 shadow-lg shadow-black/10"
                >
                  <button
                    onClick={() => {
                      onUploadFile?.()
                      closeMenu()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <UploadCloud size={17} />
                    Upload file
                  </button>
                  <button
                    onClick={() => {
                      onCreateFolder?.()
                      closeMenu()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <FolderPlus size={17} />
                    New folder
                  </button>

                  <div className="my-1.5 border-t border-black/5" />

                  <button
                    onClick={() => scanInputRef.current?.click()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <ScanLine size={17} />
                    Scan document
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Camera size={17} />
                    Camera
                  </button>

                  <div className="my-1.5 border-t border-black/5" />

                  {GOOGLE_SHORTCUTS.map(({ label, url, color }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span className={`h-[17px] w-[17px] rounded-sm ${color} bg-current opacity-20`} />
                      {label}
                    </a>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items with a shared animated active pill */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onMobileClose} className="relative">
              {({ isActive }) => (
                <div className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-lg bg-brand-50"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon
                    size={18}
                    className={`relative z-10 ${isActive ? 'text-brand-600' : 'text-gray-500'}`}
                  />
                  <span
                    className={`relative z-10 font-medium ${
                      isActive ? 'text-brand-700' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Storage quota */}
        <div className="mt-4 rounded-xl bg-surface-muted px-3.5 py-3">
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {formatFileSize(storageUsedBytes)} of {formatFileSize(storageQuotaBytes)} used
          </p>
        </div>
      </aside>
    </>
  )
}