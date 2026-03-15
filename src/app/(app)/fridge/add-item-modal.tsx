'use client'

import { useState, useRef, useCallback } from 'react'
import { useGamification } from '@/app/(app)/gamification-context'
import {
  X,
  Mic,
  MicOff,
  Camera,
  Keyboard,
  Loader2,
  Check,
  ChevronLeft,
  Sparkles,
  Upload,
} from 'lucide-react'
import { addItem, addItems } from '@/app/actions/inventory'

type Mode = null | 'voice' | 'photo' | 'manual'

interface ExtractedItem {
  name: string
  qty: number
  unit: string
  category: string
  estimated_expiry_days?: number
  action: string
}

const UNITS = ['pz', 'kg', 'g', 'litri', 'ml', 'scatole'] as const
const CATEGORIES = [
  'Protein',
  'Vegetable',
  'Fruit',
  'Dairy',
  'Carbohydrate',
  'Condiment',
  'General',
] as const

export default function AddItemModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [checked, setChecked] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { awardXP } = useGamification()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const reset = useCallback(() => {
    setMode(null)
    setIsRecording(false)
    setIsLoading(false)
    setIsAdding(false)
    setItems([])
    setChecked([])
    setError(null)
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const toggleCheck = useCallback((index: number) => {
    setChecked((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  // ─── AI extraction handler ───
  async function handleExtract(payload: {
    text?: string
    audioBase64?: string
    imageBase64?: string
    mimeType?: string
  }) {
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

  // ─── Voice recording ───
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
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          handleExtract({
            audioBase64: base64,
            mimeType: mediaRecorder.mimeType,
          })
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

  // ─── Photo/receipt handling ───
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      handleExtract({ imageBase64: base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  // ─── Add confirmed AI items ───
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
    setError(null)
    try {
      const result = await addItems(selected)
      if (result?.error) {
        setError(result.error)
      } else {
        selected.forEach(() => awardXP('item_added', 5))
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add items')
    } finally {
      setIsAdding(false)
    }
  }

  // ─── Manual form submit ───
  async function handleManualSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await addItem(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        awardXP('item_added', 5)
        formRef.current?.reset()
        handleClose()
      }
    } catch {
      setError('Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {mode && (
              <button
                onClick={() => {
                  setMode(null)
                  setItems([])
                  setChecked([])
                  setError(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 -ml-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'voice'
                ? 'Voice Input'
                : mode === 'photo'
                  ? 'Scan Receipt'
                  : mode === 'manual'
                    ? 'Manual Entry'
                    : 'Add Items'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ─── Mode Selection ─── */}
          {!mode && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-500 mb-2">
                How would you like to add items?
              </p>

              <button
                onClick={() => setMode('voice')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-olive-300 hover:bg-olive-50/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-olive-100 flex items-center justify-center shrink-0 group-hover:bg-olive-200 transition-colors">
                  <Mic className="w-6 h-6 text-olive-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Voice Input</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record a voice memo listing what you bought
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('photo')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-olive-300 hover:bg-olive-50/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 group-hover:bg-sky-200 transition-colors">
                  <Camera className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Photo / Scan Receipt
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Take a photo of your receipt — AI reads items & estimates
                    expiry
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-olive-300 hover:bg-olive-50/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <Keyboard className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Manual Entry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type in item details yourself
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ─── Voice Mode ─── */}
          {mode === 'voice' && items.length === 0 && !isLoading && (
            <div className="flex flex-col items-center gap-6 py-6">
              <p className="text-sm text-slate-500 text-center">
                Tap the microphone and tell me what you bought
              </p>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-olive-600 text-white hover:bg-olive-700 shadow-lg'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </span>
            </div>
          )}

          {/* ─── Photo Mode ─── */}
          {mode === 'photo' && items.length === 0 && !isLoading && (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-slate-500 text-center">
                Take a photo of your receipt or upload an image
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute(
                        'capture',
                        'environment'
                      )
                      fileInputRef.current.click()
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-olive-400 hover:bg-olive-50/50 transition-all"
                >
                  <Camera className="w-8 h-8 text-olive-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Take Photo
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all"
                >
                  <Upload className="w-8 h-8 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Upload Image
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Loading State ─── */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">
                <Sparkles className="w-4 h-4 inline mr-1 text-olive-500" />
                {mode === 'photo'
                  ? 'Reading your receipt...'
                  : 'Analyzing your voice...'}
              </p>
            </div>
          )}

          {/* ─── Error ─── */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* ─── Extracted Items Preview (voice & photo) ─── */}
          {(mode === 'voice' || mode === 'photo') &&
            items.length > 0 &&
            !isLoading && (
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
                        {checked[i] && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-slate-500 text-sm ml-2">
                          {item.qty} {item.unit}
                        </span>
                        {item.estimated_expiry_days && (
                          <span className="text-xs text-slate-400 ml-2">
                            ~{item.estimated_expiry_days}d
                          </span>
                        )}
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
                    {isAdding
                      ? 'Adding...'
                      : `Add Selected (${checked.filter(Boolean).length})`}
                  </button>
                </div>
              </div>
            )}

          {/* ─── Manual Entry Form ─── */}
          {mode === 'manual' && (
            <form
              ref={formRef}
              action={handleManualSubmit}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Pollo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={0.01}
                    step="any"
                    defaultValue={1}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    name="unit"
                    defaultValue="pz"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue="General"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-600/30 focus:border-olive-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full bg-olive-600 text-white py-3 rounded-xl font-semibold hover:bg-olive-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add to Fridge'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
