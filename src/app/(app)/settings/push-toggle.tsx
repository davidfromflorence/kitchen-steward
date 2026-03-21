'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { savePushSubscription, removePushSubscription } from '@/app/actions/push'

export default function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  async function handleToggle() {
    if (!supported || loading) return
    setLoading(true)

    try {
      if (subscribed) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        await removePushSubscription()
        setSubscribed(false)
      } else {
        // Subscribe
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          console.error('VAPID public key not configured')
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })

        await savePushSubscription(JSON.stringify(sub))
        setSubscribed(true)
      }
    } catch (e) {
      console.error('Push toggle error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  const denied = permission === 'denied'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subscribed ? (
            <Bell className="w-5 h-5 text-olive-600" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <h2 className="text-base font-bold text-slate-800">Notifiche push</h2>
            <p className="text-xs text-slate-400">
              {denied
                ? 'Bloccate dal browser — abilita nelle impostazioni'
                : subscribed
                  ? 'Attive — riceverai avvisi sulle scadenze'
                  : 'Ricevi avvisi quando qualcosa sta per scadere'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={denied || loading}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
            subscribed ? 'bg-olive-600' : 'bg-slate-300'
          }`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${
            subscribed ? 'translate-x-5' : 'translate-x-0'
          }`}>
            {subscribed ? (
              <Bell className="w-3 h-3 text-olive-600" />
            ) : (
              <BellOff className="w-3 h-3 text-slate-400" />
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
