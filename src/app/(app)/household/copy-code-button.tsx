'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://kitchen-steward.vercel.app/join/${code}`
  const shareText = `Unisciti al mio frigo su Kitchen Steward! Usa questo link: ${shareUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kitchen Steward — Invito',
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
          copied
            ? 'bg-olive-100 text-olive-600'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiato!' : 'Copia codice'}
      </button>
      <button
        onClick={handleShare}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-olive-600 text-white hover:bg-olive-700 text-sm font-semibold transition-all active:scale-95"
      >
        <Share2 className="w-4 h-4" />
        Condividi
      </button>
    </div>
  )
}
