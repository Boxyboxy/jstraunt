'use server'

import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { venueSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createVenue(formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    description: formData.get('description') as string,
    capacity: Number(formData.get('capacity')),
    kitchen_notes: formData.get('kitchen_notes') as string,
    map_embed_url: formData.get('map_embed_url') as string,
  }

  const parsed = venueSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await db.from('venues').insert(parsed.data)
  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/venues')
  redirect('/admin/venues')
}

export async function updateVenue(id: string, formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    description: formData.get('description') as string,
    capacity: Number(formData.get('capacity')),
    kitchen_notes: formData.get('kitchen_notes') as string,
    map_embed_url: formData.get('map_embed_url') as string,
  }

  const parsed = venueSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await db.from('venues').update(parsed.data).eq('id', id)
  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/venues')
  revalidatePath(`/admin/venues/${id}`)
  redirect('/admin/venues')
}

export async function deleteVenue(id: string) {
  await requireAuth()
  const db = createAdminClient()

  // Check if any events reference this venue
  const { count } = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', id)

  if (count && count > 0) {
    return {
      error: `Cannot delete: ${count} event${count > 1 ? 's' : ''} still linked to this venue. Reassign or delete them first.`,
    }
  }

  const { error } = await db.from('venues').delete().eq('id', id)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/venues')
  redirect('/admin/venues')
}
