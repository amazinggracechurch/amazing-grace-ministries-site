'use client'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

export type ToastVariant = 'neutral' | 'success' | 'danger'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, options?: { variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const variantIcon: Record<ToastVariant, ReactNode> = {
  neutral: <Info className="size-4 text-text-muted" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4 text-success" aria-hidden="true" />,
  danger: <AlertCircle className="size-4 text-danger" aria-hidden="true" />,
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 5000)
    return () => clearTimeout(timer)
  }, [item.id, onDismiss])

  return (
    <div className="flex items-start gap-3 rounded-card border border-border-subtle bg-surface-raised p-4 shadow-lifted">
      <span className="mt-0.5 shrink-0">{variantIcon[item.variant]}</span>
      <p className="flex-1 text-body-sm text-text-primary">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-m-1 shrink-0 rounded-lg p-1 text-text-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-text-primary"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * Wrap the app (or a subtree) once; call useToast().toast(message, {variant})
 * anywhere below. Toasts stack bottom-right in an aria-live="polite" region
 * and auto-dismiss after 5 seconds.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, options?: { variant?: ToastVariant }) => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [...current, { id, message, variant: options?.variant ?? 'neutral' }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className={cn(
          'pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2'
        )}
      >
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
