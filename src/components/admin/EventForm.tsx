'use client'

import { useActionState, useState } from 'react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import MenuBuilder, { type CourseData } from '@/components/admin/MenuBuilder'
import { slugify } from '@/lib/utils'

type Event = Database['public']['Tables']['events']['Row']
type Venue = Database['public']['Tables']['venues']['Row']

interface EventFormProps {
  event?: Event
  venues: Venue[]
  initialCourses?: CourseData[]
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>
}

export default function EventForm({ event, venues, initialCourses = [], action }: EventFormProps) {
  const [winePairing, setWinePairing] = useState(event?.wine_pairing ?? false)
  const [title, setTitle] = useState(event?.title ?? '')
  const [slug, setSlug] = useState(event?.slug ?? '')
  const [autoSlug, setAutoSlug] = useState(!event)

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData)
    },
    null
  )

  const errors = (state as { error?: Record<string, string[]> } | null)?.error

  function handleTitleChange(value: string) {
    setTitle(value)
    if (autoSlug) {
      setSlug(slugify(value))
    }
  }

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {errors?._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {errors._form.join(', ')}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2">
          Event Details
        </h2>

        <Input
          id="title"
          name="title"
          label="Event Title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder='e.g. "Spring Omakase at The Loft"'
          error={errors?.title?.join(', ')}
        />

        <div>
          <Input
            id="slug"
            name="slug"
            label="URL Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setAutoSlug(false)
            }}
            required
            placeholder="spring-omakase-loft"
            error={errors?.slug?.join(', ')}
          />
          <p className="text-xs text-burgundy-300 mt-1">
            URL: /events/{slug || '...'}
          </p>
        </div>

        <div>
          <label htmlFor="venue_id" className="block text-sm font-medium text-burgundy-700 mb-1">
            Venue
          </label>
          <select
            id="venue_id"
            name="venue_id"
            required
            defaultValue={event?.venue_id ?? ''}
            className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
          >
            <option value="" disabled>Select a venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.capacity} seats)</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-burgundy-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={event?.description ?? ''}
            className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
            placeholder="Describe the theme or concept for this event..."
          />
        </div>
      </section>

      {/* Date & Time */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2">
          Date &amp; Capacity
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="event_date"
            name="event_date"
            label="Event Date"
            type="date"
            defaultValue={event?.event_date ?? ''}
            required
            error={errors?.event_date?.join(', ')}
          />
          <Input
            id="event_time"
            name="event_time"
            label="Start Time"
            type="time"
            defaultValue={event?.event_time?.slice(0, 5) ?? '19:00'}
            required
            error={errors?.event_time?.join(', ')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="total_seats"
            name="total_seats"
            label="Total Seats"
            type="number"
            defaultValue={event?.total_seats ?? 16}
            required
            min={1}
            max={30}
            error={errors?.total_seats?.join(', ')}
          />
          <Input
            id="booking_deadline"
            name="booking_deadline"
            label="Booking Deadline"
            type="datetime-local"
            defaultValue={event?.booking_deadline?.slice(0, 16) ?? ''}
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2">
          Pricing
        </h2>

        <Input
          id="price_per_seat"
          name="price_per_seat"
          label="Price Per Seat ($)"
          type="number"
          step="0.01"
          defaultValue={event?.price_per_seat ?? ''}
          required
          min={0}
          placeholder="185.00"
          error={errors?.price_per_seat?.join(', ')}
        />

        <div className="flex items-center gap-3">
          <input
            type="hidden"
            name="wine_pairing"
            value={winePairing ? 'true' : 'false'}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={winePairing}
              onChange={(e) => setWinePairing(e.target.checked)}
              className="rounded border-cream-400 text-burgundy-900 focus:ring-burgundy-900"
            />
            <span className="text-sm font-medium text-burgundy-700">
              Offer wine pairing add-on
            </span>
          </label>
        </div>

        {winePairing && (
          <Input
            id="wine_price"
            name="wine_price"
            label="Wine Pairing Price ($)"
            type="number"
            step="0.01"
            defaultValue={event?.wine_price ?? ''}
            min={0}
            placeholder="75.00"
            error={errors?.wine_price?.join(', ')}
          />
        )}
      </section>

      {/* Menu Builder */}
      <section>
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2 mb-4">
          Menu
        </h2>
        <MenuBuilder initialCourses={initialCourses} winePairing={winePairing} />
      </section>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-cream-300">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
