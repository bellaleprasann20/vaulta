import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'

/**
 * Drag-and-drop upload zone. Fires onFilesSelected(FileList) for both
 * drop and click-to-browse — the caller wires that into the
 * init-upload -> PUT bytes -> complete-upload flow against the backend
 * (POST /files/init-upload, then PUT to the signed URL, then
 * POST /files/complete-upload). This component only handles selection.
 *
 * Props:
 *  - onFilesSelected(files: FileList)
 *  - compact: bool — smaller inline variant vs. full empty-state size
 */
export default function UploadDropzone({ onFilesSelected, compact = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const inputRef = useRef(null)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        onFilesSelected?.(e.dataTransfer.files)
      }
    },
    [onFilesSelected]
  )

  return (
    <motion.div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{
        borderColor: isDragging ? 'rgba(116, 64, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDragging ? 'rgba(116, 64, 255, 0.04)' : 'rgba(0, 0, 0, 0)',
        scale: isDragging ? 1.01 : 1,
      }}
      transition={{ duration: 0.15 }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center ${
        compact ? 'gap-2 px-6 py-6' : 'gap-3 px-6 py-16'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFilesSelected?.(e.target.files)
          e.target.value = '' // allow re-selecting the same file later
        }}
      />

      <motion.div
        animate={{ y: isDragging ? -4 : 0, scale: isDragging ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`flex items-center justify-center rounded-full ${
          isDragging ? 'bg-brand-100' : 'bg-brand-50'
        } ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}
      >
        <UploadCloud
          size={compact ? 18 : 26}
          className="text-brand-500"
          strokeWidth={1.8}
        />
      </motion.div>

      <div>
        <p className={`font-medium text-gray-700 ${compact ? 'text-sm' : 'text-base'}`}>
          {isDragging ? 'Drop to upload' : 'Drag files here, or click to browse'}
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-gray-400">
            Supports images, PDFs, documents, and archives up to 100MB
          </p>
        )}
      </div>
    </motion.div>
  )
}