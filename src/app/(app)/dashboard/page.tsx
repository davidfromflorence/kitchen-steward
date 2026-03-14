import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddButton from './add-button'
import {
  Leaf,
  DollarSign,
  CloudOff,
  Clock,
  ShoppingCart,
  UtensilsCrossed,
  Milk,
  Apple,
  Salad,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function daysUntilExpiry(expiryDate: string | null): number {
  if (!expiryDate) return 999
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000
  )
}

function expiryDotColor(days: number): string {
  if (days <= 1) return 'bg-red-500'
  if (days <= 3) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function expiryBadgeVariant(days: number): 'destructive' | 'outline' | 'secondary' {
  if (days <= 1) return 'destructive'
  if (days <= 3) return 'outline'
  return 'secondary'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  // --- Derived stats ---
  const totalItems = inventory.length
  const expiredCount = inventory.filter(
    (item) => daysUntilExpiry(item.expiry_date) < 0
  ).length
  const wasteFreePct =
    totalItems > 0
      ? Math.round(((totalItems - expiredCount) / totalItems) * 100)
      : 100

  const fillPct = Math.min(Math.round((totalItems / 30) * 100), 100)

  const expiringSoonItems = inventory
    .filter((item) => item.expiry_date && daysUntilExpiry(item.expiry_date) >= 0)
    .slice(0, 3)

  const firstName = profile.full_name?.split(' ')[0] || 'Chef'

  // --- Mock activity data ---
  const activities = [
    { icon: Milk, text: 'Mom added Oat Milk', time: '2h ago' },
    { icon: UtensilsCrossed, text: 'Sam consumed Leftover Pasta', time: '5h ago' },
    { icon: Apple, text: 'You added Granny Smith Apples', time: '8h ago' },
    { icon: ShoppingCart, text: 'Dad restocked Chicken Breast', time: '1d ago' },
    { icon: Salad, text: 'Emma used Mixed Greens for salad', time: '1d ago' },
  ]

  // --- Weekly bar chart mock data ---
  const weeklyBars = [65, 40, 80, 55, 90, 70, 45]
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 animate-in py-8 max-w-4xl mx-auto px-6 pb-12">
        {/* -- Header Row -- */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-slate-500 mt-1">
              Your kitchen is{' '}
              <span className="font-semibold text-olive-600">
                {wasteFreePct}%
              </span>{' '}
              Waste-Free Today
            </p>
          </div>
          <AddButton />
        </div>

        <Separator className="bg-slate-200" />

        {/* -- Row 1: Fridge Status + Expiring Soon -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fridge Status Card */}
          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Fridge Status
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="border-emerald-200 text-emerald-600 gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE SYSTEM
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Fill Level -- circular progress + linear progress */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#65a30d"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${fillPct * 0.974} 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                      {fillPct}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Fill Level
                  </span>
                </div>

                {/* Temperature */}
                <Tooltip>
                  <TooltipTrigger className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
                      <span className="text-lg font-bold text-sky-600">3.2°</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Internal Temp
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Optimal range: 1-4 °C</TooltipContent>
                </Tooltip>

                {/* Humidity */}
                <Tooltip>
                  <TooltipTrigger className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                      <span className="text-lg font-bold text-violet-600">42%</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Humidity Level
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Optimal range: 30-50%</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon Card */}
          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Expiring Soon
              </CardTitle>
              <CardAction>
                <Link
                  href="/fridge"
                  className="text-sm font-semibold text-olive-600 hover:underline"
                >
                  View All
                </Link>
              </CardAction>
            </CardHeader>

            <CardContent>
              {expiringSoonItems.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">
                  No items expiring soon. Nice work!
                </p>
              ) : (
                <div className="flex flex-col gap-0">
                  {expiringSoonItems.map((item, index) => {
                    const days = daysUntilExpiry(item.expiry_date)
                    return (
                      <div key={item.id}>
                        {index > 0 && <Separator className="bg-slate-100" />}
                        <div className="flex items-center gap-3 py-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${expiryDotColor(days)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-slate-800 truncate block">
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="text-xs text-slate-400">
                                ({item.quantity}
                                {item.unit ? ` ${item.unit}` : ''})
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={expiryBadgeVariant(days)}
                            className="rounded-full text-xs font-semibold whitespace-nowrap"
                          >
                            {days === 0
                              ? 'Today'
                              : days === 1
                                ? 'Expires in 1d'
                                : `Expires in ${days}d`}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* -- Row 2: Eco Impact + Activity -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eco Impact Card */}
          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Eco Impact
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Weekly Waste Saved bar chart */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Weekly Waste Saved
                </p>
                <div className="flex items-end gap-2 h-24">
                  {weeklyBars.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t-md bg-olive-500/80"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-slate-400 font-medium">
                        {weekDays[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-100 mb-4" />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <Tooltip>
                  <TooltipTrigger className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Leaf className="w-3.5 h-3.5 text-olive-600" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">12.4 kg</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Items Saved
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>Total food weight saved from waste this month</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CloudOff className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">45.8 kg</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      CO2 Saved
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>Estimated carbon emissions avoided</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">$142.50</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Money Saved
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>Estimated savings from reduced food waste</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Activity
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-0">
                {activities.map((activity, i) => {
                  const Icon = activity.icon
                  return (
                    <div key={i}>
                      {i > 0 && <Separator className="bg-slate-100" />}
                      <div className="flex items-center gap-3 py-3">
                        <Avatar className="bg-olive-50">
                          <AvatarFallback className="bg-olive-50">
                            <Icon className="w-4 h-4 text-olive-600" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="flex-1 text-sm text-slate-700">{activity.text}</p>
                        <Badge variant="secondary" className="text-xs text-slate-400 font-normal">
                          {activity.time}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>

            <CardFooter className="justify-center border-t-slate-100">
              <Link
                href="/fridge"
                className="flex items-center gap-1 text-sm font-semibold text-olive-600 hover:underline"
              >
                <Clock className="w-3.5 h-3.5" />
                View Full History
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
