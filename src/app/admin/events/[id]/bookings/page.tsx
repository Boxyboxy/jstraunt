import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Database } from '@/types/database'
import Badge from '@/components/ui/Badge'

type Event = Database['public']['Tables']['events']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type GuestDetail = Database['public']['Tables']['guest_details']['Row']

export const metadata = { title: 'Event Bookings' }

export default async function EventBookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select()
    .eq('id', id)
    .returns<Event[]>()
    .single()

  if (!event) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select()
    .eq('event_id', id)
    .order('created_at', { ascending: false })
    .returns<Booking[]>()

  // Fetch guests and guest details for each booking
  const guestIds = [...new Set((bookings ?? []).map((b) => b.guest_id))]
  const bookingIds = (bookings ?? []).map((b) => b.id)

  const [{ data: guests }, { data: guestDetails }] = await Promise.all([
    guestIds.length > 0
      ? supabase.from('guests').select().in('id', guestIds).returns<Guest[]>()
      : Promise.resolve({ data: [] as Guest[] }),
    bookingIds.length > 0
      ? supabase.from('guest_details').select().in('booking_id', bookingIds).returns<GuestDetail[]>()
      : Promise.resolve({ data: [] as GuestDetail[] }),
  ])

  const guestMap = new Map((guests ?? []).map((g) => [g.id, g]))
  const detailsByBooking = new Map<string, GuestDetail[]>()
  for (const d of guestDetails ?? []) {
    const list = detailsByBooking.get(d.booking_id) ?? []
    list.push(d)
    detailsByBooking.set(d.booking_id, list)
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to event
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">Bookings</h1>
        <p className="text-stone-500 text-sm mt-1">
          {event.title} &mdash; {event.booked_seats}/{event.total_seats} seats booked
        </p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const guest = guestMap.get(booking.guest_id)
            const details = detailsByBooking.get(booking.id) ?? []

            return (
              <div key={booking.id} className="bg-white rounded-lg border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-stone-900">{guest?.name ?? 'Unknown'}</p>
                    <p className="text-sm text-stone-500">
                      {guest?.email} {guest?.phone && `· ${guest.phone}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'}>
                      {booking.status}
                    </Badge>
                    <span className="text-sm font-medium text-stone-900">
                      {booking.pax} {booking.pax === 1 ? 'guest' : 'guests'}
                    </span>
                    {booking.wine_pairing_count > 0 && (
                      <span className="text-sm text-stone-500">
                        {booking.wine_pairing_count} wine {booking.wine_pairing_count === 1 ? 'pairing' : 'pairings'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Guest details / allergies */}
                {details.length > 0 && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                      Guest Details
                    </p>
                    <div className="space-y-2">
                      {details.map((d) => (
                        <div key={d.id} className="flex items-start gap-4 text-sm">
                          <span className="font-medium text-stone-700 w-32 flex-shrink-0">
                            {d.guest_name}
                          </span>
                          <div className="flex-1 flex flex-wrap gap-2">
                            {d.allergies.length > 0 && d.allergies.map((a) => (
                              <Badge key={a} variant={d.severity === 'life_threatening' ? 'danger' : d.severity === 'intolerance' ? 'warning' : 'default'}>
                                {a}
                              </Badge>
                            ))}
                            {d.dietary_restrictions.length > 0 && d.dietary_restrictions.map((r) => (
                              <Badge key={r} variant="info">{r}</Badge>
                            ))}
                            {d.special_requests && (
                              <span className="text-stone-500 italic">
                                &ldquo;{d.special_requests}&rdquo;
                              </span>
                            )}
                            {d.allergies.length === 0 && d.dietary_restrictions.length === 0 && !d.special_requests && (
                              <span className="text-stone-400">No restrictions</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <p className="text-stone-500">No bookings yet for this event.</p>
        </div>
      )}
    </div>
  )
}
