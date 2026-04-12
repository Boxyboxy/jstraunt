'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Dish = {
  id: string
  dish_name: string
  course_type: string | null
  photo_url: string
  event: { title: string; slug: string } | null
}

type Props = {
  dishes: Dish[]
  courseTypes: string[]
}

export default function GalleryGrid({ dishes, courseTypes }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filtered = activeFilter === 'all'
    ? dishes
    : dishes.filter(d => d.course_type === activeFilter)

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-burgundy-900 text-white'
              : 'bg-cream-200 text-burgundy-700 hover:bg-cream-300'
          }`}
        >
          All
        </button>
        {courseTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
              activeFilter === type
                ? 'bg-burgundy-900 text-white'
                : 'bg-cream-200 text-burgundy-700 hover:bg-cream-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-burgundy-400 text-sm py-16">
          No {activeFilter} dishes yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {filtered.map((dish) => (
            <div key={dish.id} className="relative aspect-square overflow-hidden group">
              <Image
                src={dish.photo_url}
                alt={dish.dish_name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-semibold leading-tight">
                  {dish.dish_name}
                </p>
                {dish.event && (
                  <Link
                    href={`/events/${dish.event.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-burgundy-300 text-xs hover:text-white transition-colors"
                  >
                    {dish.event.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
