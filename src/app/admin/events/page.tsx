import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import type { Database } from '@/types/database'
import Badge from '@/components/ui/Badge'
import { formatShortDate, formatTime, formatCurrency } from '@/lib/utils'

type Event = Database['public']['Tables']['events']['Row']

const STATUS_BADGES: Record<Event['status'], { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  sold_out: { label: 'Sold Out', variant: 'danger' },
  completed: { label: 'Completed', variant: 'info' },
  cancelled: { label: 'Cancelled', variant: 'warning' },
}

export const metadata = { title: 'Events' }

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select()
    .order('event_date', { ascending: false })
    .returns<Event[]>()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Events</h1>
          <p className="text-stone-500 text-sm mt-1">Manage your dining events and menus</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wide px-6 py-3">Event</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wide px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wide px-6 py-3">Seats</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wide px-6 py-3">Price</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wide px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {events.map((event) => {
                const badge = STATUS_BADGES[event.status]
                const fillPercent = Math.round((event.booked_seats / event.total_seats) * 100)

                return (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/events/${event.id}`} className="font-medium text-stone-900 hover:underline">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {formatShortDate(event.event_date)} at {formatTime(event.event_time)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-600">
                          {event.booked_seats}/{event.total_seats}
                        </span>
                        <div className="w-16 h-1.5 bg-stone-200 rounded-full">
                          <div
                            className="h-1.5 bg-stone-900 rounded-full"
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {formatCurrency(event.price_per_seat)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <CalendarDays className="h-8 w-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No events yet.</p>
          <Link href="/admin/events/new" className="text-stone-900 underline text-sm mt-1 inline-block">
            Create your first event
          </Link>
        </div>
      )}
    </div>
  )
}
