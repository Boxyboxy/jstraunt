'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { venueSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

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

  const { error } = await db.from('venues').delete().eq('id', id)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/venues')
  redirect('/admin/venues')
}
