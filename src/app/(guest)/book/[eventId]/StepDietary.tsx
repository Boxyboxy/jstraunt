'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { BookingAction, FormState, GuestDetail } from './StepParty'

const ALLERGEN_OPTIONS = [
  'Shellfish',
  'Nuts',
  'Dairy',
  'Gluten',
  'Eggs',
  'Soy',
  'Fish',
  'Sesame',
] as const

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Halal',
  'Kosher',
] as const

const SEVERITY_OPTIONS: { value: GuestDetail['severity']; label: string }[] = [
  { value: 'preference', label: 'Preference' },
  { value: 'intolerance', label: 'Intolerance' },
  { value: 'life_threatening', label: 'Life-threatening' },
]

interface StepDietaryProps {
  state: Pick<FormState, 'pax' | 'guestDetails' | 'errors'>
  dispatch: React.Dispatch<BookingAction>
}

function toggleArrayValue(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

export default function StepDietary({ state, dispatch }: StepDietaryProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-burgundy-900">
        Dietary Requirements
      </h2>

      {state.guestDetails.map((guest, i) => (
        <fieldset
          key={i}
          className="bg-cream-200 rounded-lg p-6 space-y-4 border-0"
        >
          <legend className="text-sm font-bold text-burgundy-900 uppercase tracking-wide">
            Guest {i + 1}
          </legend>

          <Input
            id={`guest_name_${i}`}
            label="Name"
            value={guest.guest_name}
            placeholder={`Guest ${i + 1}`}
            onChange={(e) =>
              dispatch({
                type: 'SET_GUEST_DETAIL',
                index: i,
                field: 'guest_name',
                value: e.target.value,
              })
            }
            error={state.errors[`guestDetails.${i}.guest_name`]}
          />

          {/* Allergens */}
          <div>
            <p className="text-sm font-medium text-burgundy-800 mb-2">
              Allergens
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <label
                  key={allergen}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={guest.allergies.includes(allergen)}
                    onChange={() =>
                      dispatch({
                        type: 'SET_GUEST_DETAIL',
                        index: i,
                        field: 'allergies',
                        value: toggleArrayValue(guest.allergies, allergen),
                      })
                    }
                    className="rounded border-cream-400 text-burgundy-700 focus:ring-burgundy-600"
                  />
                  <span className="text-sm text-burgundy-700">{allergen}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            id={`other_allergies_${i}`}
            label="Other allergies"
            value={guest.other_allergies}
            placeholder="e.g. Pine nuts, mangoes..."
            onChange={(e) =>
              dispatch({
                type: 'SET_GUEST_DETAIL',
                index: i,
                field: 'other_allergies',
                value: e.target.value,
              })
            }
          />

          {/* Dietary restrictions */}
          <div>
            <p className="text-sm font-medium text-burgundy-800 mb-2">
              Dietary restrictions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={guest.dietary_restrictions.includes(opt)}
                    onChange={() =>
                      dispatch({
                        type: 'SET_GUEST_DETAIL',
                        index: i,
                        field: 'dietary_restrictions',
                        value: toggleArrayValue(
                          guest.dietary_restrictions,
                          opt,
                        ),
                      })
                    }
                    className="rounded border-cream-400 text-burgundy-700 focus:ring-burgundy-600"
                  />
                  <span className="text-sm text-burgundy-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <Select
            id={`severity_${i}`}
            label="Allergy severity"
            options={SEVERITY_OPTIONS}
            value={guest.severity}
            onChange={(e) =>
              dispatch({
                type: 'SET_GUEST_DETAIL',
                index: i,
                field: 'severity',
                value: e.target.value,
              })
            }
          />

          <div>
            <label
              htmlFor={`special_requests_${i}`}
              className="block text-sm font-medium text-burgundy-800 mb-1"
            >
              Special requests
            </label>
            <textarea
              id={`special_requests_${i}`}
              rows={3}
              value={guest.special_requests}
              placeholder="Any other requests for the chef..."
              onChange={(e) =>
                dispatch({
                  type: 'SET_GUEST_DETAIL',
                  index: i,
                  field: 'special_requests',
                  value: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-600 focus:border-transparent"
            />
          </div>
        </fieldset>
      ))}
    </div>
  )
}
