'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

export async function createReview(formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = {
    guest_name: formData.get('guest_name') as string,
    rating: Number(formData.get('rating')),
    quote: formData.get('quote') as string,
    event_id: (formData.get('event_id') as string) || undefined,
    is_featured: formData.get('is_featured') === 'true',
    is_visible: formData.get('is_visible') !== 'false',
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await db.from('reviews').insert(parsed.data)
  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/reviews')
  revalidatePath('/')
  return { success: true }
}

export async function updateReview(id: string, formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = {
    guest_name: formData.get('guest_name') as string,
    rating: Number(formData.get('rating')),
    quote: formData.get('quote') as string,
    event_id: (formData.get('event_id') as string) || undefined,
    is_featured: formData.get('is_featured') === 'true',
    is_visible: formData.get('is_visible') !== 'false',
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await db.from('reviews').update(parsed.data).eq('id', id)
  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/reviews')
  revalidatePath('/')
  return { success: true }
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  await requireAuth()
  const db = createAdminClient()
  await db.from('reviews').update({ is_featured: isFeatured }).eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
}

export async function toggleVisible(id: string, isVisible: boolean) {
  await requireAuth()
  const db = createAdminClient()
  await db.from('reviews').update({ is_visible: isVisible }).eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
}

export async function deleteReview(id: string) {
  await requireAuth()
  const db = createAdminClient()
  await db.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
}
