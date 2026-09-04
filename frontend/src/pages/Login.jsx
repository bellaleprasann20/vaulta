import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { useLogin } from '../hooks/useAuth'
import HeroSecurityGraphic from '../components/common/HeroSecurityGraphic'

export default function Login() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [shake, setShake] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await login.mutateAsync({ email, password })
      navigate('/drive')
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.detail || 'Something went wrong'
      setError(message)
      setShake((s) => s + 1) // bump key to retrigger the shake animation
    }
  }

  return (
    // Changed to flex-col so it stacks vertically on mobile, and lg:flex-row for desktop
    <div className="flex min-h-screen w-full flex-col bg-surface-muted lg:flex-row">
      
      {/* LEFT SIDE (Top on Mobile): Hero Animation */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-950 px-4 py-10 lg:w-1/2 lg:min-h-screen lg:p-12">
        {/* Scaled down on mobile to fit the screen nicely, full size on desktop */}
        <div className="scale-75 transform sm:scale-90 lg:scale-100">
          <HeroSecurityGraphic />
        </div>
      </div>

      {/* RIGHT SIDE (Bottom on Mobile): Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-8 lg:w-1/2 lg:py-12">
        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-xl shadow-black/5"
        >
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-500/20">
              <div className="h-4 w-4 rounded-sm bg-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">Log in to your Vaulta account</p>
            </div>
          </div>

          <motion.form
            key={shake}
            onSubmit={handleSubmit}
            animate={shake > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4"
          >
            <FieldWithIcon icon={Mail}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </FieldWithIcon>

            <FieldWithIcon icon={Lock}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </FieldWithIcon>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={login.isPending}
              className="mt-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow disabled:opacity-50"
            >
              {login.isPending ? 'Authenticating…' : 'Log in'}
            </motion.button>
          </motion.form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 transition-colors hover:text-brand-800">
              Create one now
            </Link>
          </p>
        </motion.div>
        
      </div>
    </div>
  )
}

function FieldWithIcon({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-gray-50/50 px-3.5 py-3 transition-all focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100/50 hover:border-black/20">
      <Icon size={18} className="shrink-0 text-gray-400" />
      {children}
    </div>
  )
}