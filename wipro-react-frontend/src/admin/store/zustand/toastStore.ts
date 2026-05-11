import { create } from 'zustand'

export type ToastVariant = 'error' | 'success' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastStore {
  toasts: Toast[]
  push: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

export const toastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, variant }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  error: (msg: string) => toastStore.getState().push(msg, 'error'),
  success: (msg: string) => toastStore.getState().push(msg, 'success'),
  info: (msg: string) => toastStore.getState().push(msg, 'info'),
}
