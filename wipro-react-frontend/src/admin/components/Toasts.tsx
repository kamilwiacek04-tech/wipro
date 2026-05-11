import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { toastStore, type Toast, type ToastVariant } from '@admin/store/zustand/toastStore'

const VARIANTS: Record<ToastVariant, { bar: string; icon: React.ReactNode; label: string }> = {
  error: {
    bar: 'bg-red-500',
    icon: <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
    label: 'Błąd',
  },
  success: {
    bar: 'bg-green-500',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />,
    label: 'Sukces',
  },
  info: {
    bar: 'bg-[#ffb400]',
    icon: <Info className="h-4 w-4 text-[#ffb400] shrink-0 mt-0.5" />,
    label: 'Info',
  },
}

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { dismiss } = toastStore()
  const v = VARIANTS[toast.variant]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="relative flex items-start gap-3 w-80 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-gray-100 overflow-hidden pr-9 pl-4 py-3.5"
    >
      {/* accent bar */}
      <span className={`absolute left-0 inset-y-0 w-[3px] rounded-l-xl ${v.bar}`} />

      {v.icon}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{v.label}</p>
        <p className="text-sm text-gray-800 leading-snug break-words">{toast.message}</p>
      </div>

      <button
        onClick={() => dismiss(toast.id)}
        className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* progress bar */}
      <motion.span
        className={`absolute bottom-0 left-0 h-[2px] ${v.bar} opacity-30`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.5, ease: 'linear' }}
      />
    </motion.div>
  )
}

const Toasts = () => {
  const { toasts } = toastStore()

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toasts
