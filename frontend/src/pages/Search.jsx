import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import FolderCard from '../components/folders/FolderCard'
import FileGrid from '../components/files/FileGrid'
import FilePreview from '../components/files/FilePreview'
import ShareModal from '../components/sharing/ShareModal'
import Loading from '../components/common/Loading'
import { useSearch } from '../hooks/useSearch'
import { useDownloadUrl, useToggleFileStar, useTrashFile } from '../hooks/useFiles'
import { useToggleFolderStar, useTrashFolder } from '../hooks/useFolders'
import { shareService } from '../services/shareService'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data: results, isLoading } = useSearch(query)
  const downloadUrl = useDownloadUrl()
  const toggleFileStar = useToggleFileStar()
  const toggleFolderStar = useToggleFolderStar()
  const trashFile = useTrashFile()
  const trashFolder = useTrashFolder()
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)

  function handleOpenFile(file) {
    setPreviewFile(file)
    setPreviewUrl(null)
    downloadUrl.mutate(file.id, { onSuccess: setPreviewUrl })
  }

  const files = results?.files || []
  const folders = results?.folders || []
  const isEmpty = !isLoading && files.length === 0 && folders.length === 0

  return (
    <div>
      <motion.h1
        key={query}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 text-base font-semibold text-gray-900"
      >
        {query ? (
          <>
            Results for <span className="text-brand-600">"{query}"</span>
          </>
        ) : (
          'Search'
        )}
      </motion.h1>

      {isLoading && <Loading full label="Searching…" />}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <SearchX size={36} className="mb-3 text-gray-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">
            {query ? 'No results found' : 'Type something to search'}
          </p>
        </div>
      )}

      {!isLoading && !isEmpty && (
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