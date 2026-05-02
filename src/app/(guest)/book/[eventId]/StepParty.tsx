'use client'

import Select from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

// Inline FormState + BookingAction types until BookingForm.tsx (Plan 04) re-exports them.
// Note: other_allergies and special_requests are typed as `string` (not optional) so they
// can drive controlled inputs. Zod's optional() only affects parse-time validation.
export type GuestDetail = {
  guest_name: string
  allergies: string[]
  other_allergies: string
  dietary_restrictions: string[]
  severity: 'preference' | 'intolerance' | 'life_threatening'
  special_requests: string
}

export type FormState = {
  step: 1 | 2 | 3 | 4
  pax: number
  wineOptIn: boolean
  winePairingCount: number
  guestDetails: GuestDetail[]
  contact: { name: string; email: string; phone: string }
  errors: Record<string, string>
  isSubmitting: boolean
  bookingId: string | null
}

export type BookingAction =
  | { type: 'SET_PAX'; pax: number }
  | { type: 'SET_WINE_OPT_IN'; value: boolean }
  | { type: 'SET_WINE_COUNT'; count: number }
  | {
      type: 'SET_GUEST_DETAIL'
      index: number
      field: keyof GuestDetail
      value: string | string[]
    }
  | { type: 'SET_CONTACT'; field: string; value: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'SUBMIT' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_FIELD_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_SUCCESS'; bookingId: string }
  | { type: 'RESTORE'; payload: Partial<FormState> }

interface StepPartyProps {
  event: Event
  seatsLeft: number
  state: Pick<FormState, 'pax' | 'wineOptIn' | 'winePairingCount' | 'errors'>
  dispatch: React.Dispatch<BookingAction>
}

export default function StepParty({
  event,
  seatsLeft,
  state,
  dispatch,
}: StepPartyProps) {
  const maxPax = Math.max(1, Math.min(8, seatsLeft))
  const paxOptions = Array.from({ length: maxPax }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))
  const wineCountOptions = Array.from(
    { length: Math.max(1, state.pax) },
    (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }),
  )

  const seatSubtotal = state.pax * event.price_per_seat
  const wineSubtotal =
    state.wineOptIn && event.wine_price
      ? state.winePairingCount * event.wine_price
      : 0
  const total = seatSubtotal + wineSubtotal

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-burgundy-900">
        Reserve Your Seats
      </h2>

      <Select
        id="pax"
        label="Number of guests"
        options={paxOptions}
        value={String(state.pax)}
        onChange={(e) =>
          dispatch({ type: 'SET_PAX', pax: Number(e.target.value) })
        }
        error={state.errors.pax}
      />

      {event.wine_pairing && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.wineOptIn}
              onChange={(e) =>
                dispatch({ type: 'SET_WINE_OPT_IN', value: e.target.checked })
              }
              className="rounded border-cream-400 text-burgundy-700 focus:ring-burgundy-600"
            />
            <span className="text-sm text-burgundy-700">
              Add wine pairing ({formatCurrency(event.wine_price ?? 0)}/person)
            </span>
          </label>

          {state.wineOptIn && (
            <Select
              id="wine_count"
              label="Wine pairings"
              options={wineCountOptions}
              value={String(state.winePairingCount)}
              onChange={(e) =>
                dispatch({
                  type: 'SET_WINE_COUNT',
                  count: Number(e.target.value),
                })
              }
              error={state.errors.winePairingCount}
            />
          )}
        </div>
      )}

      {/* Price summary */}
      <div className="bg-cream-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm text-burgundy-700">
          <span>
            {state.pax} {state.pax === 1 ? 'guest' : 'guests'} ×{' '}
            {formatCurrency(event.price_per_seat)}
          </span>
          <span>{formatCurrency(seatSubtotal)}</span>
        </div>
        {state.wineOptIn &&
          event.wine_price &&
          state.winePairingCount > 0 && (
            <div className="flex justify-between text-sm text-burgundy-700">
              <span>
                {state.winePairingCount} wine pairing
                {state.winePairingCount === 1 ? '' : 's'} ×{' '}
                {formatCurrency(event.wine_price)}
              </span>
              <span>{formatCurrency(wineSubtotal)}</span>
            </div>
          )}
        <div className="flex justify-between text-sm font-bold text-burgundy-900 border-t border-cream-300 pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
