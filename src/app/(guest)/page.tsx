import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Review = Database['public']['Tables']['reviews']['Row']
type Venue = Database['public']['Tables']['venues']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: upcomingEvents }, { data: reviews }, { data: previewDishes }] = await Promise.all([
    supabase
      .from('events')
      .select()
      .eq('status', 'published' as Event['status'])
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(1)
      .returns<Event[]>(),
    supabase
      .from('reviews')
      .select()
      .eq('is_featured', true)
      .eq('is_visible', true)
      .limit(3)
      .returns<Review[]>(),
    supabase
      .from('past_dishes')
      .select('id, dish_name, photo_url')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const nextEvent = upcomingEvents?.[0] ?? null

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

  const seatsRemaining = nextEvent ? nextEvent.total_seats - nextEvent.booked_seats : 0
  const isAlmostFull = nextEvent && seatsRemaining > 0 && seatsRemaining <= 3

  const featuredReview = reviews?.[0] ?? null
  const secondaryReviews = reviews?.slice(1) ?? []

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
              Limited seats. Evenings worth remembering.
            </p>

            {nextEvent && (
              <div className="mt-8 sm:mt-10 border border-burgundy-700 rounded-lg p-5 sm:p-6">
                <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-3">
                  Next Event
                </p>
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug">{nextEvent.title}</h2>
                {nextEvent.description && (
                  <p className="mt-2 text-sm text-burgundy-300 leading-relaxed">
                    {nextEvent.description}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-burgundy-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-burgundy-300">
                  <span>
                    {new Date(nextEvent.event_date + 'T00:00:00').toLocaleDateString('en-SG', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    · {nextEvent.event_time.slice(0, 5)}
                  </span>
                  {venueName && <span>{venueName}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-burgundy-300">
                    {formatCurrency(nextEvent.price_per_seat)}/person
                  </span>
                  {isAlmostFull ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-medium">
                      {seatsRemaining} seat{seatsRemaining === 1 ? '' : 's'} left
                    </span>
                  ) : seatsRemaining > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sage-700/30 text-sage-300 font-medium">
                      {seatsRemaining} of {nextEvent.total_seats} seats available
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/events/${nextEvent.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 bg-white text-burgundy-900 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-cream-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  View this event
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {!nextEvent && (
              <div className="mt-8">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 bg-white text-burgundy-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-cream-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  View upcoming events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-lg sm:text-xl font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-10 sm:mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          <div>
            <p className="text-3xl font-heading font-bold text-cream-400 mb-3 leading-none">01</p>
            <h3 className="text-base font-semibold text-burgundy-900 mb-2">Choose your evening</h3>
            <p className="text-sm text-burgundy-400 leading-relaxed">
              Browse our upcoming events — each one is a distinct menu at a different venue, hosted by the same chef&rsquo;s table team.
            </p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold text-cream-400 mb-3 leading-none">02</p>
            <h3 className="text-base font-semibold text-burgundy-900 mb-2">Reserve your seat</h3>
            <p className="text-sm text-burgundy-400 leading-relaxed">
              Dinners are limited to a small group. Book online and receive a confirmation with everything you need to know before you arrive.
            </p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold text-cream-400 mb-3 leading-none">03</p>
            <h3 className="text-base font-semibold text-burgundy-900 mb-2">Arrive and enjoy</h3>
            <p className="text-sm text-burgundy-400 leading-relaxed">
              Share a table with a small group of strangers who leave as friends. Multiple courses, wine pairings available, no rush.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {featuredReview && (
        <section className="bg-cream-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 className="text-lg sm:text-xl font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-10 sm:mb-12">
              What our guests say
            </h2>

            {/* Featured review */}
            <div className="mb-10 sm:mb-12 max-w-2xl">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: featuredReview.rating }).map((_, i) => (
                  <span key={i} className="text-gold-400 text-lg">&#9733;</span>
                ))}
              </div>
              <blockquote className="text-burgundy-800 text-lg sm:text-xl leading-relaxed font-light">
                &ldquo;{featuredReview.quote}&rdquo;
              </blockquote>
              <p className="mt-4 text-xs font-medium text-burgundy-400 uppercase tracking-widest">
                {featuredReview.guest_name}
              </p>
            </div>

            {/* Secondary reviews */}
            {secondaryReviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-cream-300">
                {secondaryReviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="text-gold-400 text-sm">&#9733;</span>
                      ))}
                    </div>
                    <blockquote className="text-burgundy-600 text-sm italic leading-relaxed">
                      &ldquo;{review.quote}&rdquo;
                    </blockquote>
                    <p className="mt-3 text-xs font-medium text-burgundy-400 uppercase tracking-widest">
                      {review.guest_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Past Dishes Preview */}
      {previewDishes && previewDishes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="mb-10 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-heading font-semibold uppercase tracking-wide text-burgundy-900">
              From our kitchen
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previewDishes.map((dish) => (
              <Link
                key={dish.id}
                href="/gallery"
                className="group relative aspect-square overflow-hidden rounded-lg block"
              >
                <Image
                  src={dish.photo_url}
                  alt={dish.dish_name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/70 via-transparent to-transparent" />
                <p className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-semibold leading-tight">
                  {dish.dish_name}
                </p>
              </Link>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Link
              href="/gallery"
              className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
            >
              View all dishes →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
