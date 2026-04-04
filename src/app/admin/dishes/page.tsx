import { createClient } from '@/lib/supabase/server'
import { UtensilsCrossed } from 'lucide-react'
import type { Database } from '@/types/database'
import DishesManager from './DishesManager'

type PastDish = Database['public']['Tables']['past_dishes']['Row']
type Event = Database['public']['Tables']['events']['Row']

export const metadata = { title: 'Past Dishes' }

export default async function DishesPage() {
  const supabase = await createClient()

  const [{ data: dishes }, { data: events }] = await Promise.all([
    supabase.from('past_dishes').select().order('created_at', { ascending: false }).returns<PastDish[]>(),
    supabase.from('events').select().order('event_date', { ascending: false }).returns<Event[]>(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-burgundy-900">Past Dishes</h1>
        <p className="text-burgundy-400 text-sm mt-1">Manage your dish portfolio and gallery</p>
      </div>

      <DishesManager dishes={dishes ?? []} events={events ?? []} />
    </div>
  )
}
