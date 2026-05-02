import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
// import BookingForm from './BookingForm' // uncomment after Plan 04

export const revalidate = 60

type Event = Database['public']['Tables']['events']['Row']

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function BookPage({ params }: PageProps) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .in('status', ['published', 'sold_out'])
    .single<Event>()

  // PGRST116 = no rows returned; anything else is a real error
  if (error && error.code !== 'PGRST116') throw error
  if (!event) notFound()

  const seatsLeft = event.total_seats - event.booked_seats
  const isSoldOut = event.status === 'sold_out' || seatsLeft === 0

  if (isSoldOut) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center py-16">
          <h1 className="font-heading font-bold uppercase tracking-wide text-burgundy-900 text-2xl mb-3">
            Sold Out
          </h1>
          <p className="text-sm text-burgundy-500 mb-6">
            This event is fully booked. Check back for upcoming events.
          </p>
          <Link href="/events" className="text-sm text-burgundy-700 underline">
            View all events
          </Link>
        </div>
      </div>
    )
  }

  // TODO: replace placeholder with <BookingForm event={event} seatsLeft={seatsLeft} />
  // after BookingForm.tsx is created in Plan 04
  return (
    <div className="min-h-screen bg-cream-50">
      <p className="text-center py-10 text-burgundy-400 text-sm">Booking form loading...</p>
    </div>
  )
}
