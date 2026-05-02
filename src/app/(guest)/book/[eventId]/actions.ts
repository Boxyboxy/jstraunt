'use server'

import { createClient } from '@/lib/supabase/server'
import { bookingSchema } from '@/lib/validators'

function mapRpcError(msg: string): string {
  if (msg.includes('Not enough seats available')) {
    // Extract the available count if present: "Requested: 4, Available: 2"
    const match = msg.match(/Available:\s*(\d+)/)
    const n = match ? match[1] : '0'
    return `Sorry, those seats were just taken. Only ${n} seat(s) remain.`
  }
  if (msg.includes('not accepting bookings')) {
    return 'This event is no longer accepting bookings.'
  }
  if (msg.includes('Booking deadline has passed')) {
    return 'The booking deadline for this event has passed.'
  }
  return 'Something went wrong. Please try again.'
}

export async function submitBooking(
  payload: unknown,
): Promise<
  | { bookingId: string }
  | { error: string; fieldErrors?: Record<string, string> }
> {
  const parsed = bookingSchema.safeParse(payload)
  if (!parsed.success) {
    // Flatten Zod field errors so the client can highlight the offending input.
    // Map server-side field names back to the client's UI field names where they differ.
    const flat = parsed.error.flatten()
    const fieldErrors: Record<string, string> = {}
    const map: Record<string, string> = {
      guestName: 'name',
      guestEmail: 'email',
      guestPhone: 'phone',
    }
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (!msgs || msgs.length === 0) continue
      const uiKey = map[key] ?? key
      fieldErrors[uiKey] = msgs[0] as string
    }
    return { error: 'Please correct the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_booking', {
    p_event_id: parsed.data.eventId,
    p_guest_name: parsed.data.guestName,
    p_guest_email: parsed.data.guestEmail,
    p_guest_phone: parsed.data.guestPhone,
    p_pax: parsed.data.pax,
    p_wine_pairing_count: parsed.data.winePairingCount,
    p_guest_details: parsed.data.guestDetails,
  })

  if (error) return { error: mapRpcError(error.message) }
  return { bookingId: data as string }
}
