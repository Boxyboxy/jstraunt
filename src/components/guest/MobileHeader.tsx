'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UtensilsCrossed, Menu, X } from 'lucide-react'

// Links are hidden until their pages are built to avoid 404s for first-time visitors
const navLinks: { href: string; label: string }[] = [
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
]

export default function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-cream-300">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-burgundy-700" />
          <span className="text-lg font-heading font-semibold uppercase tracking-wide text-burgundy-900">
            Palette
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger — only shown when there are nav links */}
        {navLinks.length > 0 && (
          <button
            type="button"
            className="sm:hidden p-2 -mr-2 text-burgundy-700"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </nav>

      {/* Mobile menu dropdown */}
      {open && navLinks.length > 0 && (
        <div className="sm:hidden border-t border-cream-300 bg-cream-50">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-base text-burgundy-600 hover:text-burgundy-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
