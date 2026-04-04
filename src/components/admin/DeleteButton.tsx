'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface DeleteButtonProps {
  action: () => Promise<{ error?: string } | void>
  label: string
}

export default function DeleteButton({ action, label }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
        {label}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-stone-500">Are you sure?</span>
      <Button
        variant="danger"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(async () => { await action() })}
      >
        {isPending ? 'Deleting...' : 'Confirm'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  )
}
