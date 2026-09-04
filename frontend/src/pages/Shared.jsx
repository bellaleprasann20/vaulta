import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import FileGrid from '../components/files/FileGrid'
import FilePreview from '../components/files/FilePreview'
import Loading from '../components/common/Loading'
import { shareService } from '../services/shareService'
import { fileService } from '../services/fileService'
import { useDownloadUrl, useToggleFileStar } from '../hooks/useFiles'

export default function Shared() {
  const [sharedFiles, setSharedFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const downloadUrl = useDownloadUrl()
  const toggleFileStar = useToggleFileStar()
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const shares = await shareService.listSharedWithMe()
        // ShareRead only carries file_id/folder_id, not the nested
        // resource — fetch each file's actual details. (Folder shares
        // are omitted here; they belong in MyDrive's folder view once
        // that navigation is wired up.)
        const fileShares = shares.filter((s) => s.file_id)
        const files = await Promise.all(
          fileShares.map((s) => fileService.get(s.file_id).catch(() => null))
        )
        setSharedFiles(files.filter(Boolean))
      } catch (err) {
        console.error('Failed to load shared items', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleOpenFile(file) {
    setPreviewFile(file)
    setPreviewUrl(null)
    downloadUrl.mutate(file.id, { onSuccess: setPreviewUrl })
  }

  if (loading) return <Loading full label="Loading shared files…" />

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-2"
      >
        <Users size={18} className="text-gray-400" />
        <h1 className="text-base font-semibold text-gray-900">Shared with me</h1>
      </motion.div>

      <FileGrid
        files={sharedFiles}
        onOpen={handleOpenFile}
        onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
      />

      <FilePreview
        file={previewFile}
        previewUrl={previewUrl}
        onClose={() => setPreviewFile(null)}
        onDownload={() => window.open(previewUrl, '_blank')}
        onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
      />
    </div>
  )
}