'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

interface BookingSuccessProps {
  bookingId: string
  pax: number
  event: Event
}

export default function BookingSuccess({ bookingId, pax, event }: BookingSuccessProps) {
  useEffect(() => {
    sessionStorage.removeItem(`booking:${event.id}`)
  }, [event.id])

  // Show the full UUID so support can uniquely look up a booking. Truncating
  // to 8 chars only gives ~32 bits of entropy, which is not unique enough at
  // even modest booking volume. Display in groups for readability.
  const reference = bookingId.toUpperCase()

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <CheckCircle className="w-16 h-16 text-sage-600 mx-auto mb-6" />

        <h1 className="font-heading font-bold uppercase tracking-wide text-burgundy-900 text-2xl sm:text-3xl mb-3">
          Booking Confirmed
        </h1>

        <p className="text-sm text-burgundy-500 mb-2">
          {pax} {pax === 1 ? 'seat' : 'seats'} at {event.title}
        </p>

        <p className="text-xs text-burgundy-400 mb-6">
          Your seats are reserved. You&apos;ll receive a confirmation at your email.
        </p>

        <div className="bg-cream-200 rounded-lg py-3 px-4 inline-block mb-8">
          <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-1">
            Booking reference
          </p>
          <p className="font-mono text-xs sm:text-sm font-bold text-burgundy-900 tracking-wider break-all">
            {reference}
          </p>
        </div>

        <div>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-burgundy-700 text-white text-sm font-medium hover:bg-burgundy-800 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  )
}
