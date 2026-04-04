'use client'

import { useActionState } from 'react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type Venue = Database['public']['Tables']['venues']['Row']

interface VenueFormProps {
  venue?: Venue
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>
}

export default function VenueForm({ venue, action }: VenueFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData)
    },
    null
  )

  const errors = (state as { error?: Record<string, string[]> } | null)?.error

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {errors?._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {errors._form.join(', ')}
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Venue Name"
        defaultValue={venue?.name ?? ''}
        required
        placeholder="e.g. The Loft on Valencia"
        error={errors?.name?.join(', ')}
      />

      <Input
        id="address"
        name="address"
        label="Address"
        defaultValue={venue?.address ?? ''}
        required
        placeholder="742 Valencia St, San Francisco, CA 94110"
        error={errors?.address?.join(', ')}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-burgundy-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={venue?.description ?? ''}
          className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
          placeholder="Describe the atmosphere, style, and history of this space..."
        />
      </div>

      <Input
        id="capacity"
        name="capacity"
        label="Capacity"
        type="number"
        defaultValue={venue?.capacity ?? 16}
        required
        min={1}
        max={50}
        error={errors?.capacity?.join(', ')}
      />

      <div>
        <label htmlFor="kitchen_notes" className="block text-sm font-medium text-burgundy-700 mb-1">
          Kitchen Notes <span className="text-burgundy-300 font-normal">(internal only)</span>
        </label>
        <textarea
          id="kitchen_notes"
          name="kitchen_notes"
          rows={3}
          defaultValue={venue?.kitchen_notes ?? ''}
          className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
          placeholder="Equipment, access notes, parking..."
        />
      </div>

      <Input
        id="map_embed_url"
        name="map_embed_url"
        label="Google Maps Embed URL"
        type="url"
        defaultValue={venue?.map_embed_url ?? ''}
        placeholder="https://www.google.com/maps/embed?pb=..."
        error={errors?.map_embed_url?.join(', ')}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : venue ? 'Update Venue' : 'Create Venue'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
