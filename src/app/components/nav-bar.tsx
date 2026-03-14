'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Refrigerator, ChefHat, Users, Settings } from 'lucide-react'

const navItems = [
  { label: 'Fridge', href: '/dashboard', icon: Refrigerator },
  { label: 'Recipes', href: '/recipes', icon: ChefHat },
  { label: 'Household', href: '/household', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

interface NavBarProps {
  userName?: string
}

export default function NavBar({ userName }: NavBarProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 rounded-t-2xl shadow-lg pb-6 pt-2 px-2">
      <ul className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  isActive ? 'text-olive-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
