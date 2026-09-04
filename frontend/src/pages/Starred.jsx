import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import FolderCard from '../components/folders/FolderCard'
import FileGrid from '../components/files/FileGrid'
import FilePreview from '../components/files/FilePreview'
import ShareModal from '../components/sharing/ShareModal'
import Loading from '../components/common/Loading'
import { useStarredItems, useToggleFileStar, useDownloadUrl, useTrashFile } from '../hooks/useFiles'
import { useToggleFolderStar, useTrashFolder } from '../hooks/useFolders'
import { shareService } from '../services/shareService'

export default function Starred() {
  const { data, isLoading } = useStarredItems()
  const toggleFileStar = useToggleFileStar()
  const toggleFolderStar = useToggleFolderStar()
  const trashFile = useTrashFile()
  const trashFolder = useTrashFolder()
  const downloadUrl = useDownloadUrl()
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)

  function handleOpenFile(file) {
    setPreviewFile(file)
    setPreviewUrl(null)
    downloadUrl.mutate(file.id, { onSuccess: setPreviewUrl })
  }

  if (isLoading) return <Loading full label="Loading starred items…" />

  const files = data?.files || []
  const folders = data?.folders || []
  const isEmpty = files.length === 0 && folders.length === 0

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-2"
      >
        <Star size={18} className="fill-amber-400 text-amber-400" />
        <h1 className="text-base font-semibold text-gray-900">Starred</h1>
      </motion.div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <Star size={36} className="mb-3 text-gray-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Nothing starred yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Star files and folders to find them here quickly
          </p>
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={() => {}}
                  onToggleStar={(f) => toggleFolderStar.mutate({ id: f.id, isStarred: f.is_starred })}
                  onShare={(f) => setShareTarget(f)}
                  onDelete={(f) => trashFolder.mutate(f.id)}
                />
              ))}
            </div>
          )}

          <FileGrid
            files={files}
            onOpen={handleOpenFile}
            onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
            onShare={(f) => setShareTarget(f)}
            onDelete={(f) => trashFile.mutate(f.id)}
          />
        </>
      )}

      <FilePreview
        file={previewFile}
        previewUrl={previewUrl}
        onClose={() => setPreviewFile(null)}
        onDownload={() => window.open(previewUrl, '_blank')}
        onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
        onShare={(f) => setShareTarget(f)}
      />

      <ShareModal
        target={shareTarget}
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        sharedUsers={[]}
        onInvite={async (email, role) => {
          if (!shareTarget) return
          await shareService.create({ fileId: shareTarget.id, email, role })
        }}
        onCreateLink={async () => {
          if (!shareTarget) return
          await shareService.createLink({ fileId: shareTarget.id })
        }}
      />
    </div>
  )
}