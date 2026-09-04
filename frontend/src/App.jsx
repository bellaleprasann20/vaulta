import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyDrive from './pages/MyDrive'
import Shared from './pages/Shared'
import Starred from './pages/Starred'
import Trash from './pages/Trash'
import Search from './pages/Search'
import PublicShare from './pages/PublicShare'
import NotFound from './pages/NotFound'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/common/ProtectedRoute'

/**
 * The single QueryClientProvider lives in main.jsx, above <App />, since
 * it has no dependency on routing and only needs to exist once at the
 * true root. AuthProvider lives here instead: it wraps useAuth(), which
 * itself needs to be inside QueryClientProvider's tree, but has no
 * reason to sit any higher than the app shell that actually needs it.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/share/:token" element={<PublicShare />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/drive" element={<MyDrive />} />
              <Route path="/drive/:folderId" element={<MyDrive />} />
              <Route path="/shared" element={<Shared />} />
              <Route path="/starred" element={<Starred />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/search" element={<Search />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}