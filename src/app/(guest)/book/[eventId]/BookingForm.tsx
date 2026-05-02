'use client'

import { useReducer, useEffect, startTransition } from 'react'
import type { Database } from '@/types/database'
import StepIndicator from './StepIndicator'
import StepParty, {
  type FormState,
  type BookingAction,
  type GuestDetail,
} from './StepParty'
import StepDietary from './StepDietary'
import StepContact from './StepContact'
import StepReview from './StepReview'
import BookingSuccess from './BookingSuccess'
import { submitBooking } from './actions'

type Event = Database['public']['Tables']['events']['Row']

// Re-export the canonical shared types so other modules can `import ... from './BookingForm'`.
// The existing step files import from './StepParty' (Plan 02/03 convention) and continue to work.
export type { FormState, BookingAction, GuestDetail }

// --- Helpers ---

function blankGuest(): GuestDetail {
  return {
    guest_name: '',
    allergies: [],
    other_allergies: '',
    dietary_restrictions: [],
    severity: 'preference',
    special_requests: '',
  }
}

function resizeGuestDetails(arr: GuestDetail[], targetLength: number): GuestDetail[] {
  if (arr.length === targetLength) return arr
  if (arr.length > targetLength) return arr.slice(0, targetLength)
  return [...arr, ...Array.from({ length: targetLength - arr.length }, blankGuest)]
}

// --- Reducer ---

const INITIAL_PAX = 2

const initialState: FormState = {
  step: 1,
  pax: INITIAL_PAX,
  wineOptIn: false,
  winePairingCount: 0,
  guestDetails: Array.from({ length: INITIAL_PAX }, blankGuest),
  contact: { name: '', email: '', phone: '' },
  errors: {},
  isSubmitting: false,
  bookingId: null,
}

// --- Step validators ---

function validateStep(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (state.step === 1) {
    if (state.wineOptIn && state.winePairingCount < 1) {
      errors.winePairingCount = 'Choose at least one wine pairing'
    }
  }
  if (state.step === 2) {
    state.guestDetails.forEach((g, i) => {
      if (!g.guest_name.trim()) {
        errors[`guestDetails.${i}.guest_name`] = 'Required'
      }
    })
  }
  if (state.step === 3) {
    if (!state.contact.name.trim()) errors.name = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email)) {
      errors.email = 'Valid email required'
    }
    if (!state.contact.phone.trim()) errors.phone = 'Required'
  }
  return errors
}

function validateAllSteps(state: FormState): Record<string, string> {
  // For Confirm: validate every prior step regardless of current step.
  return {
    ...validateStep({ ...state, step: 1 }),
    ...validateStep({ ...state, step: 2 }),
    ...validateStep({ ...state, step: 3 }),
  }
}

function bookingReducer(state: FormState, action: BookingAction): FormState {
  switch (action.type) {
    case 'SET_PAX': {
      const newPax = Math.max(1, action.pax)
      return {
        ...state,
        pax: newPax,
        guestDetails: resizeGuestDetails(state.guestDetails, newPax),
        winePairingCount: Math.min(state.winePairingCount, newPax),
        errors: {},
      }
    }
    case 'SET_WINE_OPT_IN':
      return {
        ...state,
        wineOptIn: action.value,
        // When opting in, default to current count if non-zero, else fall back to pax
        // (avoids submitting wineOptIn=true with winePairingCount=0).
        winePairingCount: action.value
          ? state.winePairingCount > 0
            ? state.winePairingCount
            : state.pax
          : 0,
        errors: {},
      }
    case 'SET_WINE_COUNT':
      return {
        ...state,
        winePairingCount: Math.min(action.count, state.pax),
        errors: {},
      }
    case 'SET_GUEST_DETAIL': {
      const next = state.guestDetails.map((g, i) =>
        i === action.index ? { ...g, [action.field]: action.value } : g,
      )
      return { ...state, guestDetails: next }
    }
    case 'SET_CONTACT':
      return {
        ...state,
        contact: { ...state.contact, [action.field]: action.value },
      }
    case 'NEXT_STEP': {
      const next = Math.min(4, state.step + 1) as FormState['step']
      return { ...state, step: next, errors: {} }
    }
    case 'PREV_STEP': {
      const prev = Math.max(1, state.step - 1) as FormState['step']
      return { ...state, step: prev, errors: {} }
    }
    case 'GO_TO_STEP':
      return { ...state, step: action.step, errors: {} }
    case 'SUBMIT':
      return { ...state, isSubmitting: true, errors: {} }
    case 'SET_ERROR':
      return {
        ...state,
        isSubmitting: false,
        errors: { ...state.errors, _form: action.error },
      }
    case 'SET_FIELD_ERRORS':
      return {
        ...state,
        isSubmitting: false,
        errors: action.errors,
      }
    case 'SET_SUCCESS':
      return { ...state, isSubmitting: false, bookingId: action.bookingId }
    case 'RESTORE':
      return {
        ...state,
        ...action.payload,
        // Never restore transient submission state from storage:
        isSubmitting: false,
        bookingId: null,
        errors: {},
      }
    default:
      return state
  }
}

// --- Component ---

interface BookingFormProps {
  event: Event
  seatsLeft: number
}

export default function BookingForm({ event, seatsLeft }: BookingFormProps) {
  const SESSION_KEY = `booking:${event.id}`
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  // Restore from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      dispatch({ type: 'RESTORE', payload: parsed })
    } catch {
      // corrupt storage — clear and ignore
      sessionStorage.removeItem(SESSION_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to sessionStorage on state change (excluding PII contact fields)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.bookingId) {
      sessionStorage.removeItem(SESSION_KEY)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contact: _contact, ...nonPii } = state
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nonPii))
    } catch {
      // Storage full or disabled — ignore (best-effort persistence)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function handleNext() {
    const errors = validateStep(state)
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_FIELD_ERRORS', errors })
      return
    }
    dispatch({ type: 'NEXT_STEP' })
  }

  function handleConfirm() {
    if (state.isSubmitting) return // double-submit guard (defense in depth)
    // Validate every prior step (defense in depth: server validates again).
    const errors = validateAllSteps(state)
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_FIELD_ERRORS', errors })
      return
    }
    dispatch({ type: 'SUBMIT' })
    startTransition(async () => {
      const result = await submitBooking({
        eventId: event.id,
        guestName: state.contact.name,
        guestEmail: state.contact.email,
        guestPhone: state.contact.phone,
        pax: state.pax,
        wineOptIn: state.wineOptIn,
        winePairingCount: state.winePairingCount,
        guestDetails: state.guestDetails,
      })
      if ('error' in result) {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          dispatch({ type: 'SET_FIELD_ERRORS', errors: result.fieldErrors })
        } else {
          dispatch({ type: 'SET_ERROR', error: result.error })
        }
      } else {
        dispatch({ type: 'SET_SUCCESS', bookingId: result.bookingId })
      }
    })
  }

  // Success state — full page replacement
  if (state.bookingId) {
    return <BookingSuccess bookingId={state.bookingId} pax={state.pax} event={event} />
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <StepIndicator current={state.step} />

        <div className="mt-8">
          {state.step === 1 && (
            <StepParty
              event={event}
              seatsLeft={seatsLeft}
              state={state}
              dispatch={dispatch}
            />
          )}
          {state.step === 2 && (
            <StepDietary state={state} dispatch={dispatch} />
          )}
          {state.step === 3 && (
            <StepContact
              contact={state.contact}
              errors={state.errors}
              dispatch={dispatch}
            />
          )}
          {state.step === 4 && (
            <StepReview
              event={event}
              state={state}
              dispatch={dispatch}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        {/* Step navigation — Back / Next */}
        <div className="mt-8 flex justify-between">
          {state.step > 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'PREV_STEP' })}
              disabled={state.isSubmitting}
              className="text-sm text-burgundy-700 underline disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {state.step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto text-sm font-medium bg-burgundy-700 text-white px-6 py-2 rounded-md hover:bg-burgundy-800 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
