'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Refrigerator,
  ShoppingCart,
  BarChart3,
  ChefHat,
  BookOpen,
  Moon,
  Sun,
} from 'lucide-react'
import { useGamification } from './gamification-context'
import { useTheme } from './theme-context'

interface SidebarProps {
  userName?: string
  userRole?: string
}

const mainNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Il mio frigo', href: '/fridge', icon: Refrigerator },
  { label: 'Lista della spesa', href: '/shopping-list', icon: ShoppingCart },
  { label: 'Ricette', href: '/recipes', icon: ChefHat },
  { label: 'Impara', href: '/learn', icon: BookOpen },
  { label: 'Statistiche', href: '/analytics', icon: BarChart3 },
]

const bottomNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Frigo', href: '/fridge', icon: Refrigerator },
  { label: 'Ricette', href: '/recipes', icon: ChefHat },
  { label: 'Spesa', href: '/shopping-list', icon: ShoppingCart },
  { label: 'Impara', href: '/learn', icon: BookOpen },
]

function isActive(pathname: string, href: string): boolean {
  if (href.includes('#')) {
    return pathname === href.split('#')[0]
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Sidebar({ userName = 'User', userRole = 'Household Head' }: SidebarProps) {
  const pathname = usePathname()
  const initials = userName.charAt(0).toUpperCase()
  const { level, progressPercent, streak } = useGamification()
  const { resolved, setTheme } = useTheme()

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-2.5 safe-top">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-olive-600">
            <ChefHat className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Kitchen Steward</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {resolved === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center text-white text-xs font-bold"
          >
            {initials}
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white border-r border-slate-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-600">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-bold text-slate-900">Kitchen Steward</p>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-olive-100 text-olive-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}

        </nav>

        {/* Theme toggle */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-3">
              {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Dark mode
            </span>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${resolved === 'dark' ? 'bg-olive-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${resolved === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* XP Progress */}
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-olive-700">Lv. {level}</span>
            <span className="text-[10px] text-slate-400">{streak > 0 ? `🔥 ${streak}d` : ''}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-olive-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-slate-200 px-4 py-4">
          <Link href="/settings" className="flex items-center gap-3 rounded-xl px-1 py-1 -mx-1 hover:bg-slate-50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-600 text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around bg-white/95 backdrop-blur-sm border-t border-slate-200 px-1 py-1.5 safe-bottom">
        {bottomNav.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] font-semibold transition-colors ${
                active
                  ? 'text-olive-700 bg-olive-50'
                  : 'text-slate-400'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-olive-600' : ''}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
