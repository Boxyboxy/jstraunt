import { createClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'
import type { Database } from '@/types/database'
import Badge from '@/components/ui/Badge'
import ReviewActions from '@/components/admin/ReviewActions'
import ReviewFormWrapper from './ReviewFormWrapper'
import { toggleFeatured, toggleVisible, deleteReview } from './actions'

type Review = Database['public']['Tables']['reviews']['Row']
type Event = Database['public']['Tables']['events']['Row']

export const metadata = { title: 'Reviews' }

export default async function ReviewsPage() {
  const supabase = await createClient()

  const [{ data: reviews }, { data: events }] = await Promise.all([
    supabase.from('reviews').select().order('created_at', { ascending: false }).returns<Review[]>(),
    supabase.from('events').select().order('event_date', { ascending: false }).returns<Event[]>(),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Reviews</h1>
          <p className="text-stone-500 text-sm mt-1">Curate guest testimonials for the public site</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add review form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-stone-200 p-6 sticky top-8">
            <h2 className="text-lg font-medium text-stone-900 mb-4">Add Review</h2>
            <ReviewFormWrapper events={events ?? []} />
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-lg border p-5 ${
                    !review.is_visible ? 'border-stone-200 opacity-60' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-stone-900 text-sm">
                          {review.guest_name}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-amber-500" fill="currentColor" />
                          ))}
                        </div>
                        {review.is_featured && (
                          <Badge variant="warning">Featured</Badge>
                        )}
                        {!review.is_visible && (
                          <Badge variant="default">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 italic">
                        &ldquo;{review.quote}&rdquo;
                      </p>
                    </div>
                    <ReviewActions
                      id={review.id}
                      isFeatured={review.is_featured}
                      isVisible={review.is_visible}
                      onToggleFeatured={toggleFeatured}
                      onToggleVisible={toggleVisible}
                      onDelete={deleteReview}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
              <Star className="h-8 w-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">No reviews yet. Add your first one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
