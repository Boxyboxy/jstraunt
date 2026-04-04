'use client'

import { useRouter } from 'next/navigation'
import ReviewForm from '@/components/admin/ReviewForm'
import { createReview } from './actions'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default function ReviewFormWrapper({ events }: { events: Event[] }) {
  const router = useRouter()

  return (
    <ReviewForm
      events={events}
      action={createReview}
      onSuccess={() => router.refresh()}
    />
  )
}
