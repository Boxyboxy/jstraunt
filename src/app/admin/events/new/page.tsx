import { createClient } from '@/lib/supabase/server'
import EventForm from '@/components/admin/EventForm'
import { createEvent } from '../actions'
import type { Database } from '@/types/database'

type Venue = Database['public']['Tables']['venues']['Row']

export const metadata = { title: 'New Event' }

export default async function NewEventPage() {
  const supabase = await createClient()

  const { data: venues } = await supabase
    .from('venues')
    .select()
    .order('name')
    .returns<Venue[]>()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-burgundy-900">Create Event</h1>
        <p className="text-burgundy-400 text-sm mt-1">Set up a new dining event with menu</p>
      </div>
      <EventForm venues={venues ?? []} action={createEvent} />
    </div>
  )
}
