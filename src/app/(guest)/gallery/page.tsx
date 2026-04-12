import { createClient } from '@/lib/supabase/server'
import GalleryGrid from '@/components/guest/GalleryGrid'

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: dishes } = await supabase
    .from('past_dishes')
    .select('id, dish_name, course_type, photo_url, event:events(title, slug)')
    // Exclude dishes without photos — avoids broken Image tiles
    .not('photo_url', 'is', null)
    .order('created_at', { ascending: false })

  const allDishes = dishes ?? []

  // Distinct course types in the order they first appear
  const courseTypes = [...new Set(
    allDishes.map(d => d.course_type).filter((t): t is string => t !== null)
  )]

  // Count unique events for the subtitle
  const eventCount = new Set(
    allDishes
      .map(d => (d.event as { title: string; slug: string } | null)?.slug)
      .filter(Boolean)
  ).size

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10 sm:mb-12">
          <h1 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-2xl sm:text-3xl mb-2">
            Past Dishes
          </h1>
          {allDishes.length > 0 && (
            <p className="text-sm text-burgundy-400">
              {allDishes.length} dish{allDishes.length === 1 ? '' : 'es'} across {eventCount} dinner{eventCount === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {allDishes.length === 0 ? (
          <p className="text-center text-burgundy-400 text-sm py-16">
            No dishes yet — check back after our first dinner.
          </p>
        ) : (
          <GalleryGrid
            dishes={allDishes.map(d => ({
              id: d.id,
              dish_name: d.dish_name,
              course_type: d.course_type,
              photo_url: d.photo_url,
              event: d.event as { title: string; slug: string } | null,
            }))}
            courseTypes={courseTypes}
          />
        )}
      </div>
    </div>
  )
}
