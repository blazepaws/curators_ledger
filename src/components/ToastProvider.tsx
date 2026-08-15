"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"

type ToastType = "success" | "error"

type ToastItem = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  pushToast: (toast: { type: ToastType; message: string }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast: { type: ToastType; message: string }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, ...toast }])

    window.setTimeout(() => {
      removeToast(id)
    }, 2400)
  }, [removeToast])

  const value = useMemo<ToastContextValue>(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[80] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-3 py-2 text-sm shadow ${
              toast.type === "success"
                ? "bg-wow-ui-background text-wow-green"
                : "bg-wow-ui-background text-wow-red"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
