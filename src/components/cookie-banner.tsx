'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ks-cookies-accepted'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="max-w-lg mx-auto bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4 pointer-events-auto">
        <p className="text-sm flex-1">
          Usiamo solo cookie tecnici per il funzionamento dell&apos;app.{' '}
          <a href="/privacy" className="underline text-olive-300 hover:text-olive-200">Privacy policy</a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-olive-600 hover:bg-olive-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors active:scale-95"
        >
          OK
        </button>
      </div>
    </div>
  )
}
