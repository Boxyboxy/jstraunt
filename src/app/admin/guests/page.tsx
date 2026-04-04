import { createClient } from '@/lib/supabase/server'
import { Users, Search } from 'lucide-react'
import type { Database } from '@/types/database'
import Badge from '@/components/ui/Badge'

type Guest = Database['public']['Tables']['guests']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']

export const metadata = { title: 'Guests' }

export default async function GuestsPage() {
  const supabase = await createClient()

  const { data: guests } = await supabase
    .from('guests')
    .select()
    .order('created_at', { ascending: false })
    .returns<Guest[]>()

  // Fetch booking counts per guest
  const { data: bookings } = await supabase
    .from('bookings')
    .select()
    .returns<Booking[]>()

  const bookingCountMap = new Map<string, number>()
  for (const b of bookings ?? []) {
    bookingCountMap.set(b.guest_id, (bookingCountMap.get(b.guest_id) ?? 0) + 1)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-burgundy-900">Guests</h1>
        <p className="text-burgundy-400 text-sm mt-1">All guests who have booked with you</p>
      </div>

      {guests && guests.length > 0 ? (
        <div className="bg-white rounded-lg border border-cream-300 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-100">
                <th className="text-left text-xs font-medium text-burgundy-400 uppercase tracking-wide px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-burgundy-400 uppercase tracking-wide px-6 py-3">Email</th>
                <th className="text-left text-xs font-medium text-burgundy-400 uppercase tracking-wide px-6 py-3">Phone</th>
                <th className="text-left text-xs font-medium text-burgundy-400 uppercase tracking-wide px-6 py-3">Bookings</th>
                <th className="text-left text-xs font-medium text-burgundy-400 uppercase tracking-wide px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {guests.map((guest) => {
                const count = bookingCountMap.get(guest.id) ?? 0
                return (
                  <tr key={guest.id} className="hover:bg-cream-100">
                    <td className="px-6 py-4 font-medium text-burgundy-900 text-sm">{guest.name}</td>
                    <td className="px-6 py-4 text-sm text-burgundy-600">{guest.email}</td>
                    <td className="px-6 py-4 text-sm text-burgundy-600">{guest.phone ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={count > 1 ? 'success' : 'default'}>
                        {count} {count === 1 ? 'booking' : 'bookings'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-burgundy-400">
                      {new Date(guest.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-cream-300 p-12 text-center">
          <Users className="h-8 w-8 text-cream-400 mx-auto mb-3" />
          <p className="text-burgundy-400">No guests yet. Guests appear here after their first booking.</p>
        </div>
      )}
    </div>
  )
}
