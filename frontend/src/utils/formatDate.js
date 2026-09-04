/**
 * Consistent date formatting for anything with a created_at/updated_at
 * ISO string from the backend (files, folders, activity log, share
 * timestamps). FileList.jsx had an inline formatDate() doing the same
 * "Aug 23, 2026" formatting — this is that logic pulled out so it's one
 * implementation instead of one per component that needs it.
 */

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** '2:45 PM' — for contexts that need the time, not just the date. */
export function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Relative phrasing for recent activity ("2 hours ago", "Just now"),
 * falling back to formatDate for anything older than a week — matches
 * how the backend's Activity log entries would read most naturally.
 */
export function formatRelativeDate(iso) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSeconds = Math.floor((now - then) / 1000)

  if (diffSeconds < 60) return 'Just now'
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60)
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  return formatDate(iso)
}