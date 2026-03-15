'use client'

import { GamificationProvider } from './gamification-context'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <GamificationProvider>{children}</GamificationProvider>
}
