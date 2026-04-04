import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VenueForm from '@/components/admin/VenueForm'
import { updateVenue, deleteVenue } from '../actions'
import type { Database } from '@/types/database'
import DeleteButton from '@/components/admin/DeleteButton'

type Venue = Database['public']['Tables']['venues']['Row']

export const metadata = { title: 'Edit Venue' }

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue } = await supabase
    .from('venues')
    .select()
    .eq('id', id)
    .returns<Venue[]>()
    .single()

  if (!venue) notFound()

  const updateAction = async (formData: FormData) => {
    'use server'
    return updateVenue(id, formData)
  }

  const deleteAction = async () => {
    'use server'
    return deleteVenue(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Edit Venue</h1>
          <p className="text-stone-500 text-sm mt-1">{venue.name}</p>
        </div>
        <DeleteButton action={deleteAction} label="Delete Venue" />
      </div>
      <VenueForm venue={venue} action={updateAction} />
    </div>
  )
}
