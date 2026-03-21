'use client'

import { useState } from 'react'
import { Copy, Check, Share2, MessageCircle, QrCode } from 'lucide-react'

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const shareUrl = `https://kitchen-steward.vercel.app/join/${code}`
  const shareText = `Unisciti al mio frigo su Kitchen Steward! Gestisci la spesa e riduci gli sprechi insieme a me.`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Kitchen Steward — Invito', text: shareText, url: shareUrl })
      } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  // Simple QR code using a public API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Primary: Share + WhatsApp */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-olive-600 text-white hover:bg-olive-700 text-sm font-semibold transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Condividi link
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>

        {/* Secondary: Copy code + QR */}
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
            {copied ? 'Copiato!' : 'Copia link'}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              showQR
                ? 'bg-olive-100 text-olive-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR
          </button>
        </div>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="mt-3 flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-xl p-4">
          <img
            src={qrUrl}
            alt="QR Code invito"
            width={160}
            height={160}
            className="rounded-lg"
          />
          <p className="text-[11px] text-slate-400 text-center">
            Scansiona per unirti al frigo
          </p>
        </div>
      )}
    </>
  )
}
