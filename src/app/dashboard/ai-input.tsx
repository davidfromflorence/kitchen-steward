'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Mic, MicOff, Send, Loader2, Check, Sparkles } from 'lucide-react'
import { addItems } from './actions'

interface AiInputProps {
  isOpen: boolean
  onClose: () => void
}

interface ExtractedItem {
  name: string
  qty: number
  unit: string
  category: string
  estimated_expiry_days?: number
  action: string
}

type Tab = 'text' | 'voice'

export default function AiInput({ isOpen, onClose }: AiInputProps) {
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [checked, setChecked] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (isOpen) {
      setText('')
      setItems([])
      setChecked([])
      setError(null)
      setIsLoading(false)
      setIsAdding(false)
      setIsRecording(false)
    }
  }, [isOpen])

  const toggleCheck = useCallback((index: number) => {
    setChecked((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  async function handleExtract(payload: { text?: string; audioBase64?: string; mimeType?: string }) {
    setIsLoading(true)
    setError(null)
    setItems([])
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const extracted: ExtractedItem[] = data.items || []
      setItems(extracted)
      setChecked(extracted.map(() => true))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleTextSubmit() {
    if (!text.trim()) return
    handleExtract({ text: text.trim() })
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          handleExtract({ audioBase64: base64, mimeType: mediaRecorder.mimeType })
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      setError('Could not access microphone')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function handleAddSelected() {
    const selected = items
      .filter((_, i) => checked[i])
      .map((item) => ({
        name: item.name,
        quantity: item.qty,
        unit: item.unit,
        category: item.category,
        expiry_days: item.estimated_expiry_days,
      }))

    if (selected.length === 0) return

    setIsAdding(true)
    try {
      await addItems(selected)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add items')
    } finally {
      setIsAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-olive-600" />
            AI Add
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-4 bg-slate-100 rounded-xl p-1">
          {(['text', 'voice'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'text' ? 'Text' : 'Voice'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Input area (only show if no items extracted yet) */}
          {items.length === 0 && !isLoading && (
            <>
              {tab === 'text' ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ho comprato 2 kg di pollo e 6 uova..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600 transition-colors resize-none"
                  />
                  <button
                    onClick={handleTextSubmit}
                    disabled={!text.trim()}
                    className="w-full bg-olive-600 text-white py-3 rounded-xl font-semibold hover:bg-olive-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Extract Items
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-8">
                  <p className="text-sm text-slate-500 text-center">
                    Tap the microphone and tell me what you bought
                  </p>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                        : 'bg-olive-600 text-white hover:bg-olive-700 shadow-lg'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {isRecording ? 'Tap to stop' : 'Tap to record'}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Analyzing...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Extracted Items Preview */}
          {items.length > 0 && !isLoading && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-500">
                Found {items.length} item{items.length !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div
                      onClick={() => toggleCheck(i)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked[i]
                          ? 'bg-olive-600 border-olive-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked[i] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">
                        {item.qty} {item.unit}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {item.category}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setItems([])
                    setChecked([])
                    setText('')
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Redo
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={isAdding || checked.every((c) => !c)}
                  className="flex-1 bg-olive-600 text-white py-3 rounded-xl font-semibold hover:bg-olive-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Adding...' : `Add Selected (${checked.filter(Boolean).length})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
