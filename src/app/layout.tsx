import type { Metadata } from 'next'
import './globals.css'
import { Public_Sans } from 'next/font/google'
import { cn } from '@/lib/utils'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Kitchen Steward | Zero Waste, Max Taste',
  description:
    'Master your kitchen with AI-driven inventory management. Reduce food waste, save money, and eat better.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn('font-sans', publicSans.variable)}>
      <body>{children}</body>
    </html>
  )
}
