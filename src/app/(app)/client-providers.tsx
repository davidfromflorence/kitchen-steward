'use client'

import { GamificationProvider } from './gamification-context'
import { ThemeProvider } from './theme-context'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GamificationProvider>{children}</GamificationProvider>
    </ThemeProvider>
  )
}
