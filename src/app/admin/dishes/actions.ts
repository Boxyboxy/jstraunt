'use server'

import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const pastDishSchema = z.object({
  dish_name: z.string().min(1),
  description: z.string().optional(),
  course_type: z.string().optional(),
  event_id: z.string().uuid().optional(),
  photo_url: z.string().min(1),
})

export async function createPastDish(formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = {
    dish_name: formData.get('dish_name') as string,
    description: formData.get('description') as string || undefined,
    course_type: formData.get('course_type') as string || undefined,
    event_id: formData.get('event_id') as string || undefined,
    photo_url: formData.get('photo_url') as string,
  }

  const parsed = pastDishSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await db.from('past_dishes').insert({
    dish_name: parsed.data.dish_name,
    photo_url: parsed.data.photo_url,
    description: parsed.data.description ?? null,
    course_type: parsed.data.course_type ?? null,
    event_id: parsed.data.event_id ?? null,
  })
  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/dishes')
  revalidatePath('/gallery')
  return { success: true }
}

export async function deletePastDish(id: string) {
  await requireAuth()
  const db = createAdminClient()
  const { error } = await db.from('past_dishes').delete().eq('id', id)
  if (error) {
    return { error: error.message }
  }
  revalidatePath('/admin/dishes')
  revalidatePath('/gallery')
}
