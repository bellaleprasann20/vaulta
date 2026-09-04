import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List as ListIcon, FolderPlus, UploadCloud } from 'lucide-react'
import Breadcrumbs from '../components/layout/Breadcrumbs'
import FolderCard from '../components/folders/FolderCard'
import FileGrid from '../components/files/FileGrid'
import FileList from '../components/files/FileList'
import FilePreview from '../components/files/FilePreview'
import UploadDropzone from '../components/files/UploadDropzone'
import UploadProgress from '../components/files/UploadProgress'
import ShareModal from '../components/sharing/ShareModal'
import Loading from '../components/common/Loading'
import CreateFolderModal from '../components/folders/CreateFolderModal' // Added Modal Import
import { useFolderContents, useCreateFolder, useToggleFolderStar, useTrashFolder } from '../hooks/useFolders'
import { useToggleFileStar, useDownloadUrl, useTrashFile } from '../hooks/useFiles'
import { useUpload } from '../hooks/useUpload'
import { shareService } from '../services/shareService'

export default function MyDrive() {
  const { folderId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const { data: contents, isLoading } = useFolderContents(folderId)
  const createFolder = useCreateFolder(folderId)
  const toggleFolderStar = useToggleFolderStar(folderId)
  const toggleFileStar = useToggleFileStar(folderId)
  const trashFile = useTrashFile(folderId)
  const trashFolder = useTrashFolder(folderId)
  const downloadUrl = useDownloadUrl()
  const { uploads, uploadFiles, dismiss, dismissAll } = useUpload(folderId)

  const [view, setView] = useState('grid')
  const [showDropzone, setShowDropzone] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)
  
  // Added Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)

  // Listen for URL parameters from the Sidebar or Navbar
  useEffect(() => {
    if (searchParams.get('new') === 'upload') {
      setShowDropzone(true)
      setSearchParams({}) // Clear URL so it doesn't re-trigger on refresh
    }
    if (searchParams.get('new') === 'folder') {
      setIsFolderModalOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  function handleOpenFile(file) {
    setPreviewFile(file)
    setPreviewUrl(null)
    downloadUrl.mutate(file.id, { onSuccess: setPreviewUrl })
  }

  // Replaced window.prompt with React Query mutation triggered by the Modal
  async function handleSubmitFolder(name) {
    if (!name?.trim()) return
    createFolder.mutate({ name: name.trim() })
    setIsFolderModalOpen(false)
  }

  if (isLoading) return <Loading full label="Loading your files…" />

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs items={contents?.breadcrumbs || []} />

        <div className="flex items-center gap-2">
          {/* Button directly opens the modal state now */}
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-surface-muted sm:px-3"
          >
            <FolderPlus size={14} /> <span className="hidden sm:inline">New folder</span>
          </button>
          
          <button
            onClick={() => setShowDropzone((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700 sm:px-3"
          >
            <UploadCloud size={14} /> <span className="hidden sm:inline">Upload</span>
          </button>
          <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5 sm:ml-1">
            <button
              onClick={() => setView('grid')}
              className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`rounded-md p-1.5 ${view === 'list' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
            >
              <ListIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDropzone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <UploadDropzone onFilesSelected={uploadFiles} compact />
          </motion.div>
        )}
      </AnimatePresence>

      {contents?.subfolders?.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {contents.subfolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onOpen={(f) => navigate(`/drive/${f.id}`)}
              onToggleStar={(f) => toggleFolderStar.mutate({ id: f.id, isStarred: f.is_starred })}
              onShare={(f) => setShareTarget(f)}
              onDelete={(f) => trashFolder.mutate(f.id)}
            />
          ))}
        </div>
      )}

      {view === 'grid' ? (
        <FileGrid
          files={contents?.files || []}
          onOpen={handleOpenFile}
          onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
          onShare={(f) => setShareTarget(f)}
          onDelete={(f) => trashFile.mutate(f.id)}
        />
      ) : (
        <FileList
          files={contents?.files || []}
          onOpen={handleOpenFile}
          onToggleStar={(f) => toggleFileStar.mutate({ id: f.id, isStarred: f.is_starred })}
          onShare={(f) => setShareTarget(f)}
          onDelete={(f) => trashFile.mutate(f.id)}
        />
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

      {/* Render the Tailwind Modal component */}
      <CreateFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSubmit={handleSubmitFolder}
      />

      <UploadProgress uploads={uploads} onDismiss={dismiss} onDismissAll={dismissAll} />
    </div>
  )
}