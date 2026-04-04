'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/50 bg-white rounded-lg shadow-xl p-0 max-w-lg w-full"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
        {title && <h2 className="text-lg font-medium text-stone-900">{title}</h2>}
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-stone-100 transition-colors text-stone-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  )
}
