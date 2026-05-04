'use client'

import Input from '@/components/ui/Input'
import React from 'react'
import type { BookingAction } from './StepParty'

interface StepContactProps {
  contact: { name: string; email: string; phone: string }
  errors: Record<string, string>
  dispatch: React.Dispatch<BookingAction>
}

export default function StepContact({ contact, errors, dispatch }: StepContactProps) {
  function handleChange(field: 'name' | 'email' | 'phone') {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({ type: 'SET_CONTACT', field, value: e.target.value })
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-burgundy-900">
        Your Details
      </h2>

      <div className="space-y-4">
        <Input
          id="contact_name"
          label="Full name"
          type="text"
          required
          autoComplete="name"
          value={contact.name}
          onChange={handleChange('name')}
          error={errors.name}
          placeholder="Jane Smith"
        />

        <Input
          id="contact_email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={contact.email}
          onChange={handleChange('email')}
          error={errors.email}
          placeholder="jane@example.com"
        />

        <Input
          id="contact_phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          pattern="^\+?[0-9\s\-]{7,20}$"
          required
          autoComplete="tel"
          value={contact.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          placeholder="+65"
        />
      </div>
    </div>
  )
}
