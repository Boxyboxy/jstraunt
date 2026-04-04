import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventForm from '@/components/admin/EventForm'
import DeleteButton from '@/components/admin/DeleteButton'
import StatusSwitcher from '@/components/admin/StatusSwitcher'
import { updateEvent, deleteEvent, updateEventStatus } from '../actions'
import type { Database } from '@/types/database'
import type { CourseData } from '@/components/admin/MenuBuilder'
import { formatShortDate, formatTime, formatCurrency } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { Users } from 'lucide-react'

type Event = Database['public']['Tables']['events']['Row']
type Venue = Database['public']['Tables']['venues']['Row']
type Course = Database['public']['Tables']['courses']['Row']

export const metadata = { title: 'Edit Event' }

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: event },
    { data: venues },
    { data: courses },
  ] = await Promise.all([
    supabase.from('events').select().eq('id', id).returns<Event[]>().single(),
    supabase.from('venues').select().order('name').returns<Venue[]>(),
    supabase.from('courses').select().eq('event_id', id).order('sequence').returns<Course[]>(),
  ])

  if (!event) notFound()

  const initialCourses: CourseData[] = (courses ?? []).map((c) => ({
    id: c.id,
    sequence: c.sequence,
    course_type: c.course_type,
    dish_title: c.dish_title,
    description: c.description ?? undefined,
    dietary_tags: c.dietary_tags,
    photo_url: c.photo_url ?? undefined,
    wine_name: c.wine_name ?? undefined,
    wine_region: c.wine_region ?? undefined,
    wine_note: c.wine_note ?? undefined,
  }))

  const editAction = async (formData: FormData) => {
    'use server'
    return updateEvent(id, formData)
  }

  const deleteAction = async () => {
    'use server'
    return deleteEvent(id)
  }

  const statusAction = async (status: string) => {
    'use server'
    return updateEventStatus(id, status)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-burgundy-900">Edit Event</h1>
          <p className="text-burgundy-400 text-sm mt-1">{event.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/events/${id}/bookings`}
            className="inline-flex items-center gap-2 text-sm text-burgundy-600 hover:text-burgundy-900"
          >
            <Users className="h-4 w-4" />
            View Bookings ({event.booked_seats})
          </Link>
          <StatusSwitcher currentStatus={event.status} onStatusChange={statusAction} />
          <DeleteButton action={deleteAction} label="Delete" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-cream-300 rounded-lg p-4">
          <p className="text-xs text-burgundy-400">Date</p>
          <p className="text-sm font-medium text-burgundy-900 mt-1">
            {formatShortDate(event.event_date)} at {formatTime(event.event_time)}
          </p>
        </div>
        <div className="bg-white border border-cream-300 rounded-lg p-4">
          <p className="text-xs text-burgundy-400">Seats</p>
          <p className="text-sm font-medium text-burgundy-900 mt-1">
            {event.booked_seats} / {event.total_seats} booked
          </p>
        </div>
        <div className="bg-white border border-cream-300 rounded-lg p-4">
          <p className="text-xs text-burgundy-400">Price</p>
          <p className="text-sm font-medium text-burgundy-900 mt-1">
            {formatCurrency(event.price_per_seat)}/seat
          </p>
        </div>
        <div className="bg-white border border-cream-300 rounded-lg p-4">
          <p className="text-xs text-burgundy-400">Revenue (projected)</p>
          <p className="text-sm font-medium text-burgundy-900 mt-1">
            {formatCurrency(event.booked_seats * event.price_per_seat)}
          </p>
        </div>
      </div>

      <EventForm
        event={event}
        venues={venues ?? []}
        initialCourses={initialCourses}
        action={editAction}
      />
    </div>
  )
}
