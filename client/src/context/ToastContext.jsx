import { createContext, useCallback, useContext, useRef, useState } from 'react'

const Ctx = createContext(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const show = useCallback((msg, type = 'ok') => {
    clearTimeout(timer.current)
    setToast({ msg, type })
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return (
    <Ctx.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
      >
        {toast && (
          <div
            className={`pointer-events-auto rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-ink'
            }`}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
