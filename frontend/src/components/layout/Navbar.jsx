import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Settings, LogOut, User as UserIcon, X, Menu } from 'lucide-react'

/**
 * Top navbar: expanding search input + user avatar menu.
 *
 * Props:
 *  - user: { full_name, email, avatar_url } from GET /users/me
 *  - onSearch(query): fired on submit/debounced type — wired to GET /search
 *  - onLogout: wired to POST /auth/logout
 *  - onMenuClick(): opens the mobile Sidebar drawer — hidden on md+ where
 *    the sidebar is always visible and this button isn't needed
 */
export default function Navbar({ user, onSearch, onLogout, onMenuClick }) {
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    onSearch?.(query)
  }

  const initials = (user?.full_name || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/5 bg-white px-3 sm:h-16 sm:gap-4 sm:px-6">
      {/* Mobile-only hamburger — opens the Sidebar drawer */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-black/5 md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Brand mark */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <div className="h-3 w-3 rounded-sm bg-white" />
        </div>
        <span className="hidden text-[15px] font-semibold tracking-tight text-gray-900 sm:inline">
          Vaulta
        </span>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
        <motion.div
          animate={{
            boxShadow: searchFocused
              ? '0 0 0 3px rgba(116, 64, 255, 0.15)'
              : '0 0 0 0px rgba(116, 64, 255, 0)',
          }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5"
        >
          <Search size={17} className="shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search"
            className="w-full min-w-0 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </form>

      {/* User menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-semibold text-white"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-black/5 bg-white py-1.5 shadow-lg shadow-black/10"
            >
              <div className="border-b border-black/5 px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.full_name || 'Your account'}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-surface-muted">
                <UserIcon size={16} />
                Profile
              </button>
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-surface-muted">
                <Settings size={16} />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}