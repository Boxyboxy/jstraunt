'use client'

import { useActionState } from 'react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type Review = Database['public']['Tables']['reviews']['Row']
type Event = Database['public']['Tables']['events']['Row']

interface ReviewFormProps {
  review?: Review
  events: Event[]
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]>; success?: boolean } | void>
  onSuccess?: () => void
}

export default function ReviewForm({ review, events, action, onSuccess }: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await action(formData)
      if (result && 'success' in result && result.success) {
        onSuccess?.()
      }
      return result
    },
    null
  )

  const errors = (state as { error?: Record<string, string[]> } | null)?.error

  return (
    <form action={formAction} className="space-y-4">
      {errors?._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {errors._form.join(', ')}
        </div>
      )}

      <Input
        id="guest_name"
        name="guest_name"
        label="Guest Name / Initials"
        defaultValue={review?.guest_name ?? ''}
        required
        placeholder="e.g. A.K. or Sarah C."
        error={errors?.guest_name?.join(', ')}
      />

      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-burgundy-700 mb-1">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          defaultValue={review?.rating ?? 5}
          className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quote" className="block text-sm font-medium text-burgundy-700 mb-1">
          Review Quote
        </label>
        <textarea
          id="quote"
          name="quote"
          rows={3}
          defaultValue={review?.quote ?? ''}
          required
          className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
          placeholder="What the guest said..."
        />
      </div>

      <div>
        <label htmlFor="event_id" className="block text-sm font-medium text-burgundy-700 mb-1">
          Associated Event <span className="text-burgundy-300 font-normal">(optional)</span>
        </label>
        <select
          id="event_id"
          name="event_id"
          defaultValue={review?.event_id ?? ''}
          className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
        >
          <option value="">None</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="hidden"
            name="is_featured"
            value={review?.is_featured ? 'true' : 'false'}
          />
          <input
            type="checkbox"
            defaultChecked={review?.is_featured ?? false}
            onChange={(e) => {
              const hidden = e.target.previousElementSibling as HTMLInputElement
              hidden.value = e.target.checked ? 'true' : 'false'
            }}
            className="rounded border-cream-400 text-burgundy-900 focus:ring-burgundy-900"
          />
          <span className="text-sm text-burgundy-700">Featured on homepage</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="hidden"
            name="is_visible"
            value={review?.is_visible !== false ? 'true' : 'false'}
          />
          <input
            type="checkbox"
            defaultChecked={review?.is_visible !== false}
            onChange={(e) => {
              const hidden = e.target.previousElementSibling as HTMLInputElement
              hidden.value = e.target.checked ? 'true' : 'false'
            }}
            className="rounded border-cream-400 text-burgundy-900 focus:ring-burgundy-900"
          />
          <span className="text-sm text-burgundy-700">Visible on site</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : review ? 'Update Review' : 'Add Review'}
        </Button>
      </div>
    </form>
  )
}
