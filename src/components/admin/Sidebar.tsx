'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  UtensilsCrossed,
  Star,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: CalendarDays },
  { name: 'Venues', href: '/admin/venues', icon: MapPin },
  { name: 'Past Dishes', href: '/admin/dishes', icon: UtensilsCrossed },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Guests', href: '/admin/guests', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col min-h-screen">
      <div className="p-6 border-b border-stone-800">
        <h1 className="text-lg font-semibold text-white">Private Dining</h1>
        <p className="text-xs text-stone-500 mt-0.5">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-stone-800 text-white'
                  : 'hover:bg-stone-800/50 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-stone-800/50 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
