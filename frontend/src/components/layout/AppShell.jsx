import { useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import UploadProgress from '../files/UploadProgress'
import { useAuthContext } from '../../context/AuthContext'
import { useUpload } from '../../hooks/useUpload'

/**
 * Addition — not in your original tree, but MyDrive/Shared/Starred/
 * Trash/Search all render the identical Navbar+Sidebar frame around
 * different content, so this exists to avoid six copies of the same
 * fetch-user-and-render-shell logic. Renders <Outlet /> for the page
 * content via React Router's nested routes.
 *
 * Also owns the mobile drawer state (Sidebar supports it, but nothing
 * was triggering it before — this closes that gap) and a root-level
 * useUpload instance for Scan/Camera captures, since those can be
 * triggered from any page, not just My Drive. Captured photos always
 * upload to Drive's root folder, not whatever subfolder happens to be
 * open — a deliberate simplification: threading "current folder" from
 * MyDrive's route param through Sidebar/Navbar into this shell would
 * add a fair bit of plumbing for a case (scanning while browsing a
 * specific subfolder) that's likely rare in practice.
 */
export default function AppShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const capture = useUpload(null)

  async function handleLogout() {
    await logout.mutateAsync()
    navigate('/login')
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar
        user={user}
        onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
        onLogout={handleLogout}
        onMenuClick={() => setMobileNavOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          storageUsedBytes={user?.storage_used_bytes || 0}
          storageQuotaBytes={user?.storage_quota_bytes || 15 * 1024 * 1024 * 1024}
          onCreateFolder={() => navigate('/drive?new=folder')}
          onUploadFile={() => navigate('/drive?new=upload')}
          onCapture={(file) => capture.uploadFiles([file])}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet context={{ user }} />
        </main>
      </div>

      <UploadProgress
        uploads={capture.uploads}
        onDismiss={capture.dismiss}
        onDismissAll={capture.dismissAll}
      />
    </div>
  )
}