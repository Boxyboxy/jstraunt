import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="border-b border-stone-200">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-stone-900" />
            <span className="text-lg font-semibold text-stone-900">Private Dining</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/gallery"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              About
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Private Dining</h3>
              <p className="text-sm text-stone-500">
                Intimate tasting menu experiences at rotating venues across San Francisco.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Navigate</h3>
              <div className="space-y-2">
                <Link href="/events" className="block text-sm text-stone-500 hover:text-stone-900">
                  Upcoming Events
                </Link>
                <Link href="/gallery" className="block text-sm text-stone-500 hover:text-stone-900">
                  Past Dishes
                </Link>
                <Link href="/about" className="block text-sm text-stone-500 hover:text-stone-900">
                  About Us
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Contact</h3>
              <p className="text-sm text-stone-500">
                Questions about an event or booking?
                <br />
                hello@example.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-200 text-center">
            <p className="text-xs text-stone-400">
              &copy; {new Date().getFullYear()} Private Dining. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
