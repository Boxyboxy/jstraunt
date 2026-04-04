import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Navigation */}
      <header className="border-b border-cream-300">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-burgundy-700" />
            <span className="text-lg font-heading font-semibold uppercase tracking-wide text-burgundy-900">Palette</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/gallery"
              className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/about"
              className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
            >
              About
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-cream-300 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-3">Palette</h3>
              <p className="text-sm text-burgundy-400">
                Intimate tasting menu experiences at rotating venues across Singapore.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-3">Navigate</h3>
              <div className="space-y-2">
                <Link href="/events" className="block text-sm text-burgundy-400 hover:text-burgundy-800">
                  Upcoming Events
                </Link>
                <Link href="/gallery" className="block text-sm text-burgundy-400 hover:text-burgundy-800">
                  Past Dishes
                </Link>
                <Link href="/about" className="block text-sm text-burgundy-400 hover:text-burgundy-800">
                  About Us
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-3">Contact</h3>
              <p className="text-sm text-burgundy-400">
                Questions about an event or booking?
                <br />
                hello@example.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-cream-300 text-center">
            <p className="text-xs text-burgundy-300">
              &copy; {new Date().getFullYear()} Palette. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
