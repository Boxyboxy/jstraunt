'use client'

import { useTransition } from 'react'
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react'

interface ReviewActionsProps {
  id: string
  isFeatured: boolean
  isVisible: boolean
  onToggleFeatured: (id: string, value: boolean) => Promise<{ error: string } | void>
  onToggleVisible: (id: string, value: boolean) => Promise<{ error: string } | void>
  onDelete: (id: string) => Promise<{ error: string } | void>
}

export default function ReviewActions({
  id,
  isFeatured,
  isVisible,
  onToggleFeatured,
  onToggleVisible,
  onDelete,
}: ReviewActionsProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => { await onToggleFeatured(id, !isFeatured) })}
        className={`p-1.5 rounded-md transition-colors ${
          isFeatured
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-burgundy-300 hover:bg-cream-200 hover:text-burgundy-600'
        }`}
        title={isFeatured ? 'Unfeature' : 'Feature on homepage'}
      >
        <Star className="h-4 w-4" fill={isFeatured ? 'currentColor' : 'none'} />
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(async () => { await onToggleVisible(id, !isVisible) })}
        className={`p-1.5 rounded-md transition-colors ${
          isVisible
            ? 'text-burgundy-600 hover:bg-cream-200'
            : 'text-burgundy-300 hover:bg-cream-200'
        }`}
        title={isVisible ? 'Hide from site' : 'Show on site'}
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm('Delete this review?')) {
            startTransition(async () => { await onDelete(id) })
          }
        }}
        className="p-1.5 rounded-md text-burgundy-300 hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Delete review"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
