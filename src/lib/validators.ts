import { z } from 'zod'

export const guestDetailSchema = z.object({
  guest_name: z.string().min(1, 'Name is required'),
  allergies: z.array(z.string()).default([]),
  other_allergies: z.string().optional(),
  dietary_restrictions: z.array(z.string()).default([]),
  severity: z.enum(['preference', 'intolerance', 'life_threatening']).default('preference'),
  special_requests: z.string().optional(),
})

export const bookingSchema = z.object({
  eventId: z.string().uuid(),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  // Phone is operationally required for day-of contact and is also marked
  // `required` in the StepContact UI. SG numbers are 8 digits but we accept
  // an optional country-code prefix and intervening spaces/dashes.
  guestPhone: z.string().min(1, 'Phone number is required'),
  pax: z.number().int().min(1).max(16),
  wineOptIn: z.boolean().optional(),
  winePairingCount: z.number().int().min(0),
  guestDetails: z.array(guestDetailSchema).min(1),
}).refine(
  (data) => data.guestDetails.length === data.pax,
  { message: 'Must provide details for each guest' }
).refine(
  (data) => data.winePairingCount <= data.pax,
  { message: 'Wine pairings cannot exceed party size' }
).refine(
  // If wine is opted in, count must be at least 1 (avoid silently submitting zero pairings).
  (data) => !data.wineOptIn || data.winePairingCount >= 1,
  { message: 'Wine pairing count must be at least 1 when enabled', path: ['winePairingCount'] }
)

export const eventSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  venue_id: z.string().uuid(),
  event_date: z.string(),
  event_time: z.string(),
  total_seats: z.number().int().min(1).max(30),
  price_per_seat: z.number().positive(),
  wine_pairing: z.boolean().default(false),
  wine_price: z.number().positive().optional(),
  description: z.string().optional(),
  booking_deadline: z.string().optional(),
})

export const venueSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().min(1).max(50),
  kitchen_notes: z.string().optional(),
  map_embed_url: z.string().url().optional().or(z.literal('')),
})

export const reviewSchema = z.object({
  guest_name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  quote: z.string().min(1),
  event_id: z.string().uuid().optional(),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
})
