import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import type { Database } from '@/types/database'
import Badge from '@/components/ui/Badge'

type Venue = Database['public']['Tables']['venues']['Row']

export const metadata = { title: 'Venues' }

export default async function VenuesPage() {
  const supabase = await createClient()

  const { data: venues } = await supabase
    .from('venues')
    .select()
    .order('created_at', { ascending: false })
    .returns<Venue[]>()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Venues</h1>
          <p className="text-stone-500 text-sm mt-1">Manage your rotating kitchen locations</p>
        </div>
        <Link
          href="/admin/venues/new"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Venue
        </Link>
      </div>

      {venues && venues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/admin/venues/${venue.id}`}
              className="bg-white rounded-lg border border-stone-200 p-6 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-stone-100 rounded-md">
                  <MapPin className="h-5 w-5 text-stone-600" />
                </div>
                <Badge>{venue.capacity} seats</Badge>
              </div>
              <h3 className="font-medium text-stone-900">{venue.name}</h3>
              <p className="text-sm text-stone-500 mt-1">{venue.address}</p>
              {venue.description && (
                <p className="text-sm text-stone-400 mt-2 line-clamp-2">{venue.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <MapPin className="h-8 w-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No venues yet.</p>
          <Link href="/admin/venues/new" className="text-stone-900 underline text-sm mt-1 inline-block">
            Add your first venue
          </Link>
        </div>
      )}
    </div>
  )
}
