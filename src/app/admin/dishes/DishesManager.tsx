'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { createPastDish, deletePastDish } from './actions'

type PastDish = Database['public']['Tables']['past_dishes']['Row']
type Event = Database['public']['Tables']['events']['Row']

interface DishesManagerProps {
  dishes: PastDish[]
  events: Event[]
}

export default function DishesManager({ dishes, events }: DishesManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(id: string) {
    if (!confirm('Delete this dish?')) return
    startTransition(async () => {
      await deletePastDish(id)
      router.refresh()
    })
  }

  async function handleSubmit(formData: FormData) {
    const result = await createPastDish(formData)
    if (result && 'success' in result) {
      setShowForm(false)
      router.refresh()
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Dish'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Add Past Dish</h2>
          <form action={handleSubmit} className="space-y-4">
            <Input
              id="dish_name"
              name="dish_name"
              label="Dish Name"
              required
              placeholder="e.g. Hamachi Crudo"
            />
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                placeholder="Brief description of the dish..."
              />
            </div>
            <Input
              id="course_type"
              name="course_type"
              label="Course Type"
              placeholder="e.g. Starter, Main, Dessert"
            />
            <div>
              <label htmlFor="event_id" className="block text-sm font-medium text-stone-700 mb-1">
                Event <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <select
                id="event_id"
                name="event_id"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              >
                <option value="">None</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <Input
              id="photo_url"
              name="photo_url"
              label="Photo URL"
              required
              placeholder="https://..."
            />
            <Button type="submit">Add Dish</Button>
          </form>
        </div>
      )}

      {dishes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <div key={dish.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
              <div className="aspect-video bg-stone-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dish.photo_url}
                  alt={dish.dish_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">{dish.dish_name}</h3>
                    {dish.course_type && (
                      <Badge variant="default" className="mt-1">{dish.course_type}</Badge>
                    )}
                    {dish.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{dish.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <UtensilsCrossed className="h-8 w-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No past dishes yet. Upload photos to build your gallery.</p>
        </div>
      )}
    </div>
  )
}
