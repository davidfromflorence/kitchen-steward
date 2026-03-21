import type { Metadata } from 'next'
import './globals.css'
import { Public_Sans } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/next'
import CookieBanner from '@/components/cookie-banner'

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kitchen Steward',
  },
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
  metadataBase: new URL('https://kitchen-steward.vercel.app'),
  alternates: {
    canonical: '/',
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#587519" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ks-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <CookieBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
