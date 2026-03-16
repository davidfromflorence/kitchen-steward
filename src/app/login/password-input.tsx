'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({
  name,
  placeholder,
  minLength,
}: {
  name: string
  placeholder: string
  minLength?: number
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl px-4 py-3 pr-12 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
        type={show ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        minLength={minLength}
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
