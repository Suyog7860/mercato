import { useEffect, useRef } from 'react'
import { Icon } from './icons.jsx'

export const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 disabled:bg-paper disabled:text-mute'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60'

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-ink disabled:opacity-60'

export function Spinner({ className = 'py-24' }) {
  return (
    <div className={`flex justify-center ${className}`} role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-cobalt" />
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="aspect-square rounded-xl bg-line/70" />
      <div className="mt-3 h-3 w-1/3 rounded bg-line/70" />
      <div className="mt-2 h-4 w-3/4 rounded bg-line/70" />
      <div className="mt-3 h-5 w-1/4 rounded bg-line/70" />
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-ink/5">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
