import { Check } from 'lucide-react'

const STEPS = ['Party', 'Dietary', 'Contact', 'Review'] as const

interface StepIndicatorProps {
  current: 1 | 2 | 3 | 4
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <nav aria-label="Booking progress" className="flex items-center w-full">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4
        const done = step < current
        const active = step === current
        return (
          <div
            key={step}
            className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  done || active
                    ? 'bg-burgundy-700 text-white'
                    : 'bg-cream-300 text-burgundy-400'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="w-4 h-4" aria-hidden="true" /> : step}
              </div>
              <span
                className={`text-xs mt-1 ${
                  active ? 'text-burgundy-900' : 'text-burgundy-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 ${
                  done ? 'bg-burgundy-700' : 'bg-cream-300'
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
