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
    // Build a per-field error map keyed by dotted Zod issue paths so nested
    // errors (e.g. `guestDetails.0.guest_name`) match the client's
    // state.errors shape and highlight the specific guest card. Using
    // .flatten() here would collapse all `guestDetails.*` issues under the
    // root `guestDetails` key and the UI would show no field highlight.
    const fieldErrors: Record<string, string> = {}
    const map: Record<string, string> = {
      guestName: 'name',
      guestEmail: 'email',
      guestPhone: 'phone',
    }
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!path) continue
      const uiKey = map[path] ?? path
      // Keep the first issue per field (matches prior flatten() behavior).
      if (!fieldErrors[uiKey]) fieldErrors[uiKey] = issue.message
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
  // Defensive: the RPC contract returns a UUID on success, but `data` is typed
  // as unknown. If something unexpected slips through (RPC change, transient
  // null), surface a real error instead of dispatching SET_SUCCESS with a
  // falsy bookingId — that would re-render the form with no error and no
  // confirmation, stranding the user after the seat reservation already ran.
  if (typeof data !== 'string' || data.length === 0) {
    return {
      error:
        'Booking succeeded but the server returned an invalid reference. Please contact support.',
    }
  }
  return { bookingId: data }
}
