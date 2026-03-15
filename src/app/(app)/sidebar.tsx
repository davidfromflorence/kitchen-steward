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
  Settings,
} from 'lucide-react'
import { useGamification } from './gamification-context'

interface SidebarProps {
  userName?: string
  userRole?: string
}

const mainNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Fridge', href: '/fridge', icon: Refrigerator },
  { label: 'Shopping List', href: '/shopping-list', icon: ShoppingCart },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Recipes', href: '/recipes', icon: ChefHat },
  { label: 'Learn', href: '/learn', icon: BookOpen },
]

const bottomNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Fridge', href: '/fridge', icon: Refrigerator },
  { label: 'Recipes', href: '/recipes', icon: ChefHat },
  { label: 'Shopping', href: '/shopping-list', icon: ShoppingCart },
  { label: 'Settings', href: '/settings', icon: Settings },
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white border-r border-slate-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-600">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">Kitchen Steward</p>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
              Elite Management
            </p>
          </div>
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

          {/* Divider */}
          <div className="my-3 border-t border-slate-200" />

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(pathname, '/settings')
                ? 'bg-olive-100 text-olive-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            Settings
          </Link>
        </nav>

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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-600 text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around bg-white border-t border-slate-200 px-2 py-2 safe-bottom">
        {bottomNav.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                active
                  ? 'text-olive-700'
                  : 'text-slate-400 hover:text-slate-600'
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
