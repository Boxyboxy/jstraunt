import { format, parseISO } from 'date-fns'

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'EEEE, MMMM d, yyyy')
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy')
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return format(date, 'h:mm a')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getSeatsStatus(booked: number, total: number): 'available' | 'almost_full' | 'sold_out' {
  if (booked >= total) return 'sold_out'
  if (total - booked <= 3) return 'almost_full'
  return 'available'
}
