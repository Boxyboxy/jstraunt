import Link from 'next/link'
import { MapPin, Wine } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTime, getSeatsStatus } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import Badge from '@/components/ui/Badge'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default async function EventsPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, event_date, event_time, venue_id, total_seats, booked_seats, price_per_seat, wine_pairing, status')
    .in('status', ['published', 'sold_out'] as Event['status'][])
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  // Fetch venue names in one query — avoid N+1
  const venueIds = [...new Set((events ?? []).map(e => e.venue_id).filter(Boolean))] as string[]
  const { data: venues } = venueIds.length > 0
    ? await supabase.from('venues').select('id, name').in('id', venueIds)
    : { data: [] }

  const venueMap = Object.fromEntries((venues ?? []).map(v => [v.id, v.name]))

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-2xl sm:text-3xl mb-3">
          Upcoming Dinners
        </h1>
        <p className="text-sm text-burgundy-400 mb-10">
          Small groups. Rotating venues. Menus worth remembering.
        </p>

        {(!events || events.length === 0) && (
          <div className="py-16 text-center">
            <p className="text-burgundy-800 font-medium mb-2">No upcoming dinners right now.</p>
            <p className="text-sm text-burgundy-400 mb-6">
              We host intimate evenings regularly — check back soon, or browse what we&rsquo;ve cooked before.
            </p>
            <Link
              href="/gallery"
              className="text-sm text-burgundy-700 hover:text-burgundy-900 underline underline-offset-4"
            >
              View past dishes &rarr;
            </Link>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="divide-y divide-cream-300">
            {events.map((event) => {
              const seatsLeft = event.total_seats - event.booked_seats
              const seatStatus = getSeatsStatus(event.booked_seats, event.total_seats)
              const isSoldOut = seatStatus === 'sold_out'

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={`block py-7 group transition-opacity ${isSoldOut ? 'opacity-60' : ''}`}
                >
                  <p className="text-xs text-gold-400 font-medium uppercase tracking-widest mb-2">
                    {format(parseISO(event.event_date), 'EEE, d MMM yyyy')}
                    {' · '}
                    {formatTime(event.event_time)}
                  </p>
                  <h2 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-xl group-hover:text-burgundy-700 transition-colors mb-1">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-burgundy-400 mb-3">
                    {venueMap[event.venue_id ?? ''] && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {venueMap[event.venue_id!]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-burgundy-900">
                      {formatCurrency(event.price_per_seat)}/person
                    </span>
                    {seatStatus === 'available' && (
                      <Badge variant="success">{seatsLeft} seats available</Badge>
                    )}
                    {seatStatus === 'almost_full' && (
                      <Badge variant="warning">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</Badge>
                    )}
                    {seatStatus === 'sold_out' && (
                      <Badge variant="default">Sold out</Badge>
                    )}
                    {event.wine_pairing && (
                      <span className="inline-flex items-center gap-1 text-xs bg-cream-200 text-burgundy-700 px-2 py-0.5 rounded-full">
                        <Wine className="h-3 w-3" />
                        Wine pairing available
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
