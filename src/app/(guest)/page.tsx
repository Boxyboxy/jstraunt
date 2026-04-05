import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Review = Database['public']['Tables']['reviews']['Row']
type Venue = Database['public']['Tables']['venues']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch next upcoming event
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select()
    .eq('status', 'published' as Event['status'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(1)
    .returns<Event[]>()

  const nextEvent = upcomingEvents?.[0] ?? null

  // Fetch venue name if we have an event
  let venueName: string | null = null
  if (nextEvent?.venue_id) {
    const { data: venue } = await supabase
      .from('venues')
      .select()
      .eq('id', nextEvent.venue_id)
      .returns<Venue[]>()
      .single()
    venueName = venue?.name ?? null
  }

  // Fetch featured reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select()
    .eq('is_featured', true)
    .eq('is_visible', true)
    .limit(3)
    .returns<Review[]>()

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-burgundy-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              Intimate dining,
              <br />
              extraordinary flavors.
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-burgundy-300">
              Multi-course tasting menus at rotating venues across Singapore.
              Limited seats. Unforgettable evenings.
            </p>
            {nextEvent && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-burgundy-800 rounded-lg">
                <p className="text-xs uppercase tracking-wide text-burgundy-300 mb-1 sm:mb-2">Next Event</p>
                <h2 className="text-lg sm:text-xl font-medium">{nextEvent.title}</h2>
                <p className="text-burgundy-300 text-sm mt-1">
                  {new Date(nextEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {nextEvent.event_time.slice(0, 5)}
                  {venueName && ` \u2014 ${venueName}`}
                </p>
                <p className="text-sm text-burgundy-300 mt-3 sm:mt-4">
                  {nextEvent.total_seats - nextEvent.booked_seats} of {nextEvent.total_seats} seats remaining
                  &middot; ${nextEvent.price_per_seat}/person
                </p>
                <Link
                  href={`/events/${nextEvent.slug}`}
                  className="mt-3 sm:mt-4 inline-flex items-center gap-1 bg-white text-burgundy-900 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-cream-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  View Event
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            {!nextEvent && (
              <div className="mt-6 sm:mt-8">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 bg-white text-burgundy-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-cream-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  View Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-burgundy-900 text-center mb-8 sm:mb-12">
            What our guests say
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="text-center">
                <div className="flex justify-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i} className="text-amber-500">&#9733;</span>
                  ))}
                </div>
                <blockquote className="text-burgundy-600 text-sm italic leading-relaxed">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <p className="mt-3 text-xs font-medium text-burgundy-300 uppercase tracking-wide">
                  {review.guest_name}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-burgundy-900">
            Ready for an unforgettable evening?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-burgundy-400">
            Browse our upcoming events and book your seat at the table.
          </p>
          <Link
            href="/events"
            className="mt-5 sm:mt-6 inline-flex items-center gap-2 bg-burgundy-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-burgundy-800 transition-colors"
          >
            View All Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
