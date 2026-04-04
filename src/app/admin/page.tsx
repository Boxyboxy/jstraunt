import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, UtensilsCrossed, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalEvents },
    { count: totalGuests },
    { count: totalBookings },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('guests').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ])

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select()
    .in('status', ['published', 'sold_out'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(5)
    .returns<Event[]>()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">Overview of your private dining operations</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-md">
              <CalendarDays className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Events</p>
              <p className="text-2xl font-semibold text-stone-900">{totalEvents ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-md">
              <Users className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Guests</p>
              <p className="text-2xl font-semibold text-stone-900">{totalGuests ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-md">
              <UtensilsCrossed className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Active Bookings</p>
              <p className="text-2xl font-semibold text-stone-900">{totalBookings ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-medium text-stone-900">Upcoming Events</h2>
        </div>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {upcomingEvents.map((event) => {
              const seatsRemaining = event.total_seats - event.booked_seats
              const fillPercent = Math.round((event.booked_seats / event.total_seats) * 100)

              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-stone-900">{event.title}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at {event.event_time.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-900">
                        {event.booked_seats}/{event.total_seats} seats
                      </p>
                      <div className="w-24 h-1.5 bg-stone-200 rounded-full mt-1">
                        <div
                          className="h-1.5 bg-stone-900 rounded-full"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        event.status === 'sold_out'
                          ? 'bg-red-100 text-red-700'
                          : seatsRemaining <= 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {event.status === 'sold_out'
                        ? 'Sold Out'
                        : seatsRemaining <= 3
                          ? 'Almost Full'
                          : 'Available'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-stone-500">
            <p>No upcoming events.</p>
            <Link
              href="/admin/events/new"
              className="text-stone-900 underline text-sm mt-1 inline-block"
            >
              Create your first event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
