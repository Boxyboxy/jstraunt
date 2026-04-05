'use server'

import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { eventSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const courseSchema = z.object({
  id: z.string().optional(),
  sequence: z.number().int().min(1),
  course_type: z.string().min(1),
  dish_title: z.string().min(1),
  description: z.string().optional(),
  dietary_tags: z.array(z.string()).default([]),
  photo_url: z.string().optional(),
  wine_name: z.string().optional(),
  wine_region: z.string().optional(),
  wine_note: z.string().optional(),
})

const eventStatusSchema = z.enum(['draft', 'published', 'sold_out', 'completed', 'cancelled'])

function parseEventFormData(formData: FormData) {
  return {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    venue_id: formData.get('venue_id') as string,
    event_date: formData.get('event_date') as string,
    event_time: formData.get('event_time') as string,
    total_seats: Number(formData.get('total_seats')),
    price_per_seat: Number(formData.get('price_per_seat')),
    wine_pairing: formData.get('wine_pairing') === 'true',
    wine_price: formData.get('wine_price') ? Number(formData.get('wine_price')) : undefined,
    description: formData.get('description') as string,
    booking_deadline: formData.get('booking_deadline') as string || undefined,
  }
}

function parseCoursesFromFormData(formData: FormData) {
  const coursesJson = formData.get('courses') as string
  if (!coursesJson) return { courses: [], error: null }
  try {
    const raw = JSON.parse(coursesJson)
    const courses = z.array(courseSchema).parse(raw)
    return { courses, error: null }
  } catch (e) {
    const message = e instanceof z.ZodError
      ? e.issues.map((issue: z.ZodIssue) => issue.message).join(', ')
      : 'Invalid menu data'
    return { courses: [], error: message }
  }
}

export async function createEvent(formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = parseEventFormData(formData)
  const parsed = eventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { courses, error: coursesError } = parseCoursesFromFormData(formData)
  if (coursesError) {
    return { error: { _form: [coursesError] } }
  }

  const { data: event, error } = await db
    .from('events')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }

  // Insert courses — roll back event if this fails
  if (courses.length > 0) {
    const coursesWithEventId = courses.map((c) => ({
      ...c,
      event_id: event.id,
      id: undefined,
    }))
    const { error: coursesInsertError } = await db.from('courses').insert(coursesWithEventId)
    if (coursesInsertError) {
      // Clean up the orphaned event
      await db.from('events').delete().eq('id', event.id)
      return { error: { _form: [`Event created but menu failed to save: ${coursesInsertError.message}`] } }
    }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  redirect('/admin/events')
}

export async function updateEvent(id: string, formData: FormData) {
  await requireAuth()
  const db = createAdminClient()

  const raw = parseEventFormData(formData)
  const parsed = eventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { courses, error: coursesError } = parseCoursesFromFormData(formData)
  if (coursesError) {
    return { error: { _form: [coursesError] } }
  }

  const { error } = await db.from('events').update(parsed.data).eq('id', id)
  if (error) {
    return { error: { _form: [error.message] } }
  }

  // Replace courses: delete existing, insert new
  // If insert fails, the old courses are already gone — surface the error clearly
  const { error: deleteError } = await db.from('courses').delete().eq('event_id', id)
  if (deleteError) {
    return { error: { _form: [`Failed to update menu: ${deleteError.message}`] } }
  }

  if (courses.length > 0) {
    const coursesWithEventId = courses.map((c) => ({
      ...c,
      event_id: id,
      id: undefined,
    }))
    const { error: coursesInsertError } = await db.from('courses').insert(coursesWithEventId)
    if (coursesInsertError) {
      return { error: { _form: [`Event updated but menu failed to save: ${coursesInsertError.message}`] } }
    }
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  revalidatePath('/events')
  redirect('/admin/events')
}

export async function updateEventStatus(id: string, status: string) {
  await requireAuth()

  const parsed = eventStatusSchema.safeParse(status)
  if (!parsed.success) {
    return { error: `Invalid status: ${status}` }
  }

  const db = createAdminClient()
  const { error } = await db
    .from('events')
    .update({ status: parsed.data })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  revalidatePath('/events')
}

export async function deleteEvent(id: string) {
  await requireAuth()
  const db = createAdminClient()

  const { error } = await db.from('events').delete().eq('id', id)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  redirect('/admin/events')
}
