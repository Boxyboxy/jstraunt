'use client'

import { useState, useCallback } from 'react'
import { Plus, GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

export interface CourseData {
  id?: string
  sequence: number
  course_type: string
  dish_title: string
  description?: string
  dietary_tags: string[]
  photo_url?: string
  wine_name?: string
  wine_region?: string
  wine_note?: string
}

const COURSE_TYPES = [
  'Amuse-bouche',
  'Starter',
  'Soup',
  'Fish',
  'Meat',
  'Palate Cleanser',
  'Dessert',
  'Petit Fours',
  'Cheese',
]

const DIETARY_TAGS = ['V', 'VG', 'GF', 'DF']
const DIETARY_LABELS: Record<string, string> = {
  V: 'Vegetarian',
  VG: 'Vegan',
  GF: 'Gluten Free',
  DF: 'Dairy Free',
}

interface MenuBuilderProps {
  initialCourses?: CourseData[]
  winePairing?: boolean
}

export default function MenuBuilder({ initialCourses = [], winePairing = false }: MenuBuilderProps) {
  const [courses, setCourses] = useState<CourseData[]>(
    initialCourses.length > 0
      ? initialCourses.sort((a, b) => a.sequence - b.sequence)
      : []
  )
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const addCourse = useCallback(() => {
    setCourses((prev) => [
      ...prev,
      {
        sequence: prev.length + 1,
        course_type: COURSE_TYPES[Math.min(prev.length, COURSE_TYPES.length - 1)],
        dish_title: '',
        description: '',
        dietary_tags: [],
      },
    ])
    setExpandedIndex(courses.length)
  }, [courses.length])

  const removeCourse = useCallback((index: number) => {
    setCourses((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((c, i) => ({ ...c, sequence: i + 1 }))
    )
    setExpandedIndex(null)
  }, [])

  const updateCourse = useCallback((index: number, field: keyof CourseData, value: unknown) => {
    setCourses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }, [])

  const moveCourse = useCallback((index: number, direction: 'up' | 'down') => {
    setCourses((prev) => {
      const next = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= next.length) return prev
      ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
      return next.map((c, i) => ({ ...c, sequence: i + 1 }))
    })
    setExpandedIndex(direction === 'up' ? expandedIndex! - 1 : expandedIndex! + 1)
  }, [expandedIndex])

  const toggleTag = useCallback((index: number, tag: string) => {
    setCourses((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c
        const tags = c.dietary_tags.includes(tag)
          ? c.dietary_tags.filter((t) => t !== tag)
          : [...c.dietary_tags, tag]
        return { ...c, dietary_tags: tags }
      })
    )
  }, [])

  return (
    <div>
      {/* Hidden input to send courses JSON with the form */}
      <input type="hidden" name="courses" value={JSON.stringify(courses)} />

      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-stone-700">
          Menu Courses ({courses.length})
        </label>
        <Button type="button" variant="outline" size="sm" onClick={addCourse}>
          <Plus className="h-3.5 w-3.5" />
          Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-stone-300 rounded-lg p-8 text-center">
          <p className="text-stone-500 text-sm">No courses yet. Add your first course to build the menu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course, index) => {
            const isExpanded = expandedIndex === index

            return (
              <div
                key={index}
                className="border border-stone-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <GripVertical className="h-4 w-4 text-stone-300 flex-shrink-0" />
                  <span className="text-xs font-medium text-stone-400 w-6">{course.sequence}</span>
                  <span className="text-sm font-medium text-stone-600 w-28 flex-shrink-0">
                    {course.course_type}
                  </span>
                  <span className="text-sm text-stone-900 flex-1 truncate">
                    {course.dish_title || 'Untitled dish'}
                  </span>
                  <div className="flex items-center gap-1">
                    {course.dietary_tags.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-400" />
                  )}
                </div>

                {/* Expanded Editor */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-stone-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Course Type
                        </label>
                        <select
                          value={course.course_type}
                          onChange={(e) => updateCourse(index, 'course_type', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                        >
                          {COURSE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Dish Title"
                        value={course.dish_title}
                        onChange={(e) => updateCourse(index, 'dish_title', e.target.value)}
                        placeholder="e.g. Hamachi Crudo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={course.description ?? ''}
                        onChange={(e) => updateCourse(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                        placeholder="Describe the dish..."
                      />
                    </div>

                    {/* Dietary tags */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Dietary Tags
                      </label>
                      <div className="flex gap-2">
                        {DIETARY_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(index, tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              course.dietary_tags.includes(tag)
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                            }`}
                            title={DIETARY_LABELS[tag]}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wine pairing fields */}
                    {winePairing && (
                      <div className="pt-2 border-t border-stone-100">
                        <label className="block text-sm font-medium text-stone-700 mb-3">
                          Wine Pairing
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <Input
                            label="Wine Name"
                            value={course.wine_name ?? ''}
                            onChange={(e) => updateCourse(index, 'wine_name', e.target.value)}
                            placeholder="e.g. 2024 Sancerre"
                          />
                          <Input
                            label="Region"
                            value={course.wine_region ?? ''}
                            onChange={(e) => updateCourse(index, 'wine_region', e.target.value)}
                            placeholder="e.g. Loire Valley"
                          />
                          <Input
                            label="Tasting Note"
                            value={course.wine_note ?? ''}
                            onChange={(e) => updateCourse(index, 'wine_note', e.target.value)}
                            placeholder="e.g. Mineral-driven"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCourse(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" /> Move Up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCourse(index, 'down')}
                          disabled={index === courses.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" /> Move Down
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(index)}
                      >
                        <X className="h-3.5 w-3.5 text-red-500" /> Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
