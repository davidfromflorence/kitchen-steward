import type { Metadata } from 'next'
import './globals.css'
import { Public_Sans } from 'next/font/google'
import { cn } from '@/lib/utils'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Kitchen Steward — Riduci lo spreco alimentare con l\'AI',
  description:
    'Kitchen Steward ti aiuta a gestire il frigo, ridurre gli sprechi e risparmiare. Inventario smart con AI, ricette anti-spreco, lista della spesa automatica e chat WhatsApp.',
  keywords: [
    'spreco alimentare',
    'food waste',
    'gestione frigo',
    'fridge management',
    'ricette anti-spreco',
    'zero waste',
    'lista della spesa',
    'AI kitchen',
    'kitchen steward',
    'risparmio spesa',
  ],
  openGraph: {
    title: 'Kitchen Steward — Riduci lo spreco alimentare con l\'AI',
    description: 'Gestisci il frigo, riduci gli sprechi, risparmia. Inventario smart, ricette AI, WhatsApp integrato.',
    url: 'https://kitchen-steward.vercel.app',
    siteName: 'Kitchen Steward',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kitchen Steward — Zero Waste, Max Taste',
    description: 'AI-powered fridge management. Reduce food waste, save money, eat better.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={cn('font-sans', publicSans.variable)}>
      <body>{children}</body>
    </html>
  )
}
