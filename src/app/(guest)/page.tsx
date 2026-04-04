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
      <section className="bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Intimate dining,
              <br />
              extraordinary flavors.
            </h1>
            <p className="mt-4 text-lg text-stone-400">
              Multi-course tasting menus at rotating venues across San Francisco.
              Limited seats. Unforgettable evenings.
            </p>
            {nextEvent && (
              <div className="mt-8 p-6 bg-stone-800 rounded-lg">
                <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Next Event</p>
                <h2 className="text-xl font-medium">{nextEvent.title}</h2>
                <p className="text-stone-400 text-sm mt-1">
                  {new Date(nextEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {nextEvent.event_time.slice(0, 5)}
                  {venueName && ` \u2014 ${venueName}`}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-stone-400">
                    {nextEvent.total_seats - nextEvent.booked_seats} of {nextEvent.total_seats} seats remaining
                    &middot; ${nextEvent.price_per_seat}/person
                  </p>
                  <Link
                    href={`/events/${nextEvent.slug}`}
                    className="inline-flex items-center gap-1 bg-white text-stone-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-100 transition-colors"
                  >
                    View Event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
            {!nextEvent && (
              <div className="mt-8">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-stone-100 transition-colors"
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
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-2xl font-semibold text-stone-900 text-center mb-12">
            What our guests say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div key={review.id} className="text-center">
                <div className="flex justify-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i} className="text-amber-500">&#9733;</span>
                  ))}
                </div>
                <blockquote className="text-stone-600 text-sm italic leading-relaxed">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <p className="mt-3 text-xs font-medium text-stone-400 uppercase tracking-wide">
                  {review.guest_name}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-semibold text-stone-900">
            Ready for an unforgettable evening?
          </h2>
          <p className="mt-2 text-stone-500">
            Browse our upcoming events and book your seat at the table.
          </p>
          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            View All Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
