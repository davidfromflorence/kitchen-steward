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
        className={`p-3 rounded-xl transition-all ${
          copied
            ? 'bg-olive-100 text-olive-600'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        title="Copia codice"
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
      </button>
      <button
        onClick={handleShare}
        className="p-3 rounded-xl bg-olive-600 text-white hover:bg-olive-700 transition-all active:scale-95"
        title="Condividi link"
      >
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  )
}
