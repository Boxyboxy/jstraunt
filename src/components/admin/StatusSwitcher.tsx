'use client'

import { useTransition } from 'react'
import type { Database } from '@/types/database'

type EventStatus = Database['public']['Tables']['events']['Row']['status']

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface StatusSwitcherProps {
  currentStatus: EventStatus
  onStatusChange: (status: string) => Promise<{ error?: string } | void>
}

export default function StatusSwitcher({ currentStatus, onStatusChange }: StatusSwitcherProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => { await onStatusChange(e.target.value) })
      }}
      className="px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
