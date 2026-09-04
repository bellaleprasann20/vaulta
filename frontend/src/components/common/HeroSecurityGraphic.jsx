import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Shield, Lock, Database, Image as ImageIcon } from 'lucide-react'

// The text content that will rotate
const copyTexts = [
  {
    title: "Secure Digital Fortress",
    desc: "Your files are fragmented, encrypted via AES-256, and locked before they ever leave your device."
  },
  {
    title: "End-to-End Encryption",
    desc: "Total privacy guaranteed. Only you hold the keys to unlock and access your digital vault."
  },
  {
    title: "Lightning Fast Access",
    desc: "Instantly upload, organize, and retrieve your files securely from anywhere in the world."
  }
]

export default function HeroSecurityGraphic() {
  const [textIndex, setTextIndex] = useState(0)

  // Rotate the text every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((current) => (current + 1) % copyTexts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Config for flying files
  const files = [
    { id: 1, icon: FileText, x: -120, y: -80, delay: 0 },
    { id: 2, icon: ImageIcon, x: 120, y: -40, delay: 0.6 },
    { id: 3, icon: FileText, x: -80, y: 100, delay: 1.2 },
  ]

  return (
    <div className="relative flex w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-900 p-12 shadow-2xl">
      {/* Background Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Sweeping Laser Scanner */}
      <motion.div
        animate={{ y: ['-100%', '300%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 z-0 h-1 w-full bg-brand-500/50 shadow-[0_0_20px_4px_rgba(79,70,229,0.5)] blur-[1px]"
      />

      <div className="relative z-10 flex h-64 w-64 items-center justify-center">
        {/* Outer Rotating Cyber Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-slate-600/50"
        />
        
        {/* Inner Rotating Ring (Opposite Direction) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border-2 border-slate-700/80 border-t-brand-500"
        />

        {/* Central Glowing Vault */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0px #4f46e5', '0 0 40px #4f46e5', '0 0 0px #4f46e5'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 border border-slate-600 shadow-xl"
        >
          <Database size={40} className="text-brand-400" />
          
          {/* Animated Lock that Snaps */}
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: [0, 1.2, 1], y: 0 }}
            transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute -bottom-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.8)]"
          >
            <Lock size={20} />
          </motion.div>
        </motion.div>

        {/* Shield Overlay that pulses */}
        <motion.div
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute inset-0 flex items-center justify-center text-brand-500"
        >
          <Shield size={180} strokeWidth={0.5} />
        </motion.div>

        {/* Flying Files Animation */}
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ x: file.x, y: file.y, opacity: 0, scale: 0 }}
            animate={{ 
              x: [file.x, 0], 
              y: [file.y, 0], 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              delay: file.delay, 
              repeat: Infinity, 
              repeatDelay: 1.5,
              ease: "circIn" 
            }}
            className="absolute z-20 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-slate-300 backdrop-blur-md border border-white/20"
          >
            <file.icon size={20} />
          </motion.div>
        ))}
      </div>

      {/* Rotating Typography */}
      <div className="relative z-10 mt-8 h-28 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={textIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute left-0 right-0"
          >
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {copyTexts[textIndex].title}
            </h3>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-slate-400">
              {copyTexts[textIndex].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}