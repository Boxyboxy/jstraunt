import VenueForm from '@/components/admin/VenueForm'
import { createVenue } from '../actions'

export const metadata = { title: 'New Venue' }

export default function NewVenuePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-burgundy-900">Add Venue</h1>
        <p className="text-burgundy-400 text-sm mt-1">Create a new kitchen location</p>
      </div>
      <VenueForm action={createVenue} />
    </div>
  )
}
