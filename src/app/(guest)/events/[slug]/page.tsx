import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTime, getSeatsStatus } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import Badge from '@/components/ui/Badge'
import type { Database } from '@/types/database'

export const revalidate = 60

type Course = Database['public']['Tables']['courses']['Row']

// Roman numerals for up to 10 courses
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*),
      courses(*)
    `)
    .eq('slug', slug)
    .in('status', ['published', 'sold_out', 'completed'])
    .single()

  // PGRST116 = no rows returned; anything else is a real error
  if (error && error.code !== 'PGRST116') throw error
  if (!event) notFound()

  // Sort courses by sequence — Supabase doesn't guarantee order on joined tables
  const courses: Course[] = [...(event.courses ?? [])].sort(
    (a, b) => a.sequence - b.sequence
  )
  const venue = event.venue as Database['public']['Tables']['venues']['Row'] | null

  const seatsLeft = event.total_seats - event.booked_seats
  const seatStatus = getSeatsStatus(event.booked_seats, event.total_seats)
  const isSoldOut = seatStatus === 'sold_out'

  return (
    <div className="bg-cream-50">
      {/* ── Dark hero ── */}
      <div className="bg-burgundy-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="text-xs text-gold-400 font-medium uppercase tracking-widest mb-4">
            {format(parseISO(event.event_date), 'EEEE, d MMMM yyyy')}
            {' · '}
            {formatTime(event.event_time)}
            {venue && ` · ${venue.name}`}
          </p>
          <h1 className="font-heading font-bold uppercase tracking-wide text-white text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-sm text-burgundy-300 leading-relaxed mb-6 max-w-lg">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-white/10 text-burgundy-200 rounded px-2.5 py-1">
              {event.total_seats} seats total
            </span>
            {event.wine_pairing && (
              <span className="text-xs bg-white/10 text-burgundy-200 rounded px-2.5 py-1">
                Wine pairing available
              </span>
            )}
            {seatStatus === 'available' && (
              <Badge variant="success">{seatsLeft} seats remaining</Badge>
            )}
            {seatStatus === 'almost_full' && (
              <Badge variant="warning">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</Badge>
            )}
            {seatStatus === 'sold_out' && (
              <Badge variant="default">Sold out</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">

        {/* Venue strip */}
        {venue && (
          <div className="bg-cream-200 rounded-lg p-4 mb-10 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-cream-300 rounded flex items-center justify-center">
              <MapPin className="h-4 w-4 text-burgundy-500" />
            </div>
            <div>
              <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-0.5">Venue</p>
              <p className="text-sm font-semibold text-burgundy-900">{venue.name}</p>
              <p className="text-xs text-burgundy-400">{venue.address}</p>
              {venue.description && (
                <p className="text-xs text-burgundy-500 mt-2 leading-relaxed">{venue.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Menu */}
        {courses.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-lg mb-6">
              The Menu
            </h2>
            <div className="divide-y divide-cream-300">
              {courses.map((course, index) => (
                <div key={course.id} className="py-5 flex gap-4">
                  <span className="text-burgundy-300 italic text-sm min-w-[1.5rem] flex-shrink-0 mt-0.5">
                    {ROMAN[index] ?? index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-burgundy-400 uppercase tracking-wide mb-0.5">
                      {course.course_type}
                    </p>
                    <p className="text-sm font-semibold text-burgundy-900 mb-1">
                      {course.dish_title}
                    </p>
                    {course.description && (
                      <p className="text-sm text-burgundy-500 leading-relaxed mb-2">
                        {course.description}
                      </p>
                    )}
                    {(course.dietary_tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(course.dietary_tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-cream-200 text-burgundy-700 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {event.wine_pairing && course.wine_name && (
                      <p className="text-xs text-burgundy-400 italic">
                        ♦ {course.wine_name}
                        {course.wine_region && `, ${course.wine_region}`}
                        {course.wine_note && ` — ${course.wine_note}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-burgundy-700 border-t border-burgundy-600 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg leading-tight">
              {formatCurrency(event.price_per_seat)}
              <span className="text-burgundy-300 text-sm font-normal ml-1">/person</span>
            </p>
            {event.wine_pairing && event.wine_price && !isSoldOut && (
              <p className="text-burgundy-300 text-xs mt-0.5">
                + {formatCurrency(event.wine_price)} optional wine pairing
              </p>
            )}
          </div>
          {isSoldOut ? (
            <span className="bg-cream-200 text-burgundy-400 rounded-md px-5 py-2.5 text-sm font-medium cursor-not-allowed">
              Sold Out
            </span>
          ) : (
            <Link
              href={`/book/${event.id}`}
              className="bg-white text-burgundy-900 rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-cream-100 transition-colors whitespace-nowrap"
            >
              Reserve Your Seat &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
