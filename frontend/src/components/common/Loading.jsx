import { motion } from 'framer-motion'

/**
 * Addition — not in your original tree, but Dashboard/MyDrive/Shared/
 * Starred/Trash/Search all need a loading state while their initial
 * fetch resolves, so this exists to unblock them.
 *
 * Props:
 *  - full: bool — full-page centered spinner vs. an inline small one
 *  - label: string — optional text under the spinner
 */
export default function Loading({ full = false, label }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className="h-8 w-8 rounded-full border-2 border-brand-100 border-t-brand-600"
      />
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  )

  if (!full) return spinner

  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
      {spinner}
    </div>
  )
}