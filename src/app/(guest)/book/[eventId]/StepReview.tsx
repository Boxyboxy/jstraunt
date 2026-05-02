'use client'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { BookingAction, GuestDetail } from './StepParty'

type Event = Database['public']['Tables']['events']['Row']

interface StepReviewProps {
  event: Event
  state: {
    pax: number
    wineOptIn: boolean
    winePairingCount: number
    guestDetails: GuestDetail[]
    contact: { name: string; email: string; phone: string }
    isSubmitting: boolean
    errors: Record<string, string>
  }
  dispatch: React.Dispatch<BookingAction>
  onConfirm: () => void
}

const SEVERITY_LABELS: Record<string, string> = {
  preference: 'Preference',
  intolerance: 'Intolerance',
  life_threatening: 'Life-threatening',
}

export default function StepReview({ event, state, dispatch, onConfirm }: StepReviewProps) {
  const seatSubtotal = state.pax * event.price_per_seat
  const wineSubtotal =
    state.wineOptIn && event.wine_price
      ? state.winePairingCount * event.wine_price
      : 0
  const total = seatSubtotal + wineSubtotal

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-burgundy-900">
        Review Your Booking
      </h2>

      {/* Error banner */}
      {state.errors._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {state.errors._form}
        </div>
      )}

      {/* Event header */}
      <div className="bg-cream-200 rounded-lg p-4 space-y-1">
        <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest">Event</p>
        <p className="text-sm font-semibold text-burgundy-900">{event.title}</p>
        <p className="text-xs text-burgundy-500">
          {formatDate(event.event_date)} · {formatTime(event.event_time)}
        </p>
      </div>

      {/* Party details */}
      <div className="bg-cream-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest">Party</p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 1 })}
            className="text-xs text-burgundy-700 underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm font-semibold text-burgundy-900">
          {state.pax} {state.pax === 1 ? 'guest' : 'guests'}
          {state.wineOptIn && state.winePairingCount > 0
            ? `, ${state.winePairingCount} wine pairing${state.winePairingCount === 1 ? '' : 's'}`
            : ''}
        </p>
      </div>

      {/* Guest dietary details */}
      <div className="bg-cream-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest">Dietary</p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 2 })}
            className="text-xs text-burgundy-700 underline"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3">
          {state.guestDetails.map((guest, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-semibold text-burgundy-900">
                {guest.guest_name || `Guest ${i + 1}`}
              </p>
              {guest.severity !== 'preference' && (
                <Badge variant={guest.severity === 'life_threatening' ? 'danger' : 'warning'}>
                  {SEVERITY_LABELS[guest.severity]}
                </Badge>
              )}
              {(guest.allergies.length > 0 || guest.other_allergies) && (
                <p className="text-xs text-burgundy-500">
                  Allergies: {[...guest.allergies, guest.other_allergies].filter(Boolean).join(', ')}
                </p>
              )}
              {guest.dietary_restrictions.length > 0 && (
                <p className="text-xs text-burgundy-500">
                  Diet: {guest.dietary_restrictions.join(', ')}
                </p>
              )}
              {guest.special_requests && (
                <p className="text-xs text-burgundy-500 italic">&ldquo;{guest.special_requests}&rdquo;</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-cream-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest">Contact</p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 3 })}
            className="text-xs text-burgundy-700 underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm font-semibold text-burgundy-900">{state.contact.name}</p>
        <p className="text-xs text-burgundy-500">{state.contact.email}</p>
        <p className="text-xs text-burgundy-500">{state.contact.phone}</p>
      </div>

      {/* Price breakdown */}
      <div className="bg-cream-200 rounded-lg p-4 space-y-2">
        <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-2">Price</p>
        <div className="flex justify-between text-sm text-burgundy-700">
          <span>
            {state.pax} {state.pax === 1 ? 'guest' : 'guests'} × {formatCurrency(event.price_per_seat)}
          </span>
          <span>{formatCurrency(seatSubtotal)}</span>
        </div>
        {state.wineOptIn && event.wine_price && state.winePairingCount > 0 && (
          <div className="flex justify-between text-sm text-burgundy-700">
            <span>
              {state.winePairingCount} wine pairing{state.winePairingCount === 1 ? '' : 's'} × {formatCurrency(event.wine_price)}
            </span>
            <span>{formatCurrency(wineSubtotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold text-burgundy-900 border-t border-cream-300 pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Confirm button (also rendered in the fixed nav footer via BookingForm; this is a secondary inline one) */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={state.isSubmitting}
        onClick={onConfirm}
      >
        {state.isSubmitting ? 'Reserving...' : 'Confirm Booking'}
      </Button>
    </div>
  )
}
