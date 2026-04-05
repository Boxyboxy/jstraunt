import Link from 'next/link'
import MobileHeader from '@/components/guest/MobileHeader'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Navigation */}
      <MobileHeader />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-cream-300 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-2 sm:mb-3">Palette</h3>
              <p className="text-sm text-burgundy-400">
                Intimate tasting menu experiences at rotating venues across Singapore.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-2 sm:mb-3">Navigate</h3>
              <div className="flex gap-4 sm:block sm:space-y-2">
                <Link href="/events" className="text-sm text-burgundy-400 hover:text-burgundy-800">
                  Upcoming Events
                </Link>
                <Link href="/gallery" className="text-sm text-burgundy-400 hover:text-burgundy-800">
                  Past Dishes
                </Link>
                <Link href="/about" className="text-sm text-burgundy-400 hover:text-burgundy-800">
                  About Us
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-burgundy-900 mb-2 sm:mb-3">Contact</h3>
              <p className="text-sm text-burgundy-400">
                Questions about an event or booking?
                <br />
                hello@example.com
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-cream-300 text-center">
            <p className="text-xs text-burgundy-300">
              &copy; {new Date().getFullYear()} Palette. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
