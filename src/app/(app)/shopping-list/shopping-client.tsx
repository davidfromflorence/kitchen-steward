'use client'

import { useState } from 'react'
import {
  ShoppingCart,
  Sparkles,
  Loader2,
  Check,
  X,
  Trash2,
  Plus,
  Share2,
  Copy,
  ChefHat,
  Leaf,
} from 'lucide-react'
import {
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedItems,
  saveGeneratedList,
  addShoppingItem,
} from './actions'

interface InventoryItem {
  name: string
  quantity: number
  unit: string
  category: string
  expiry_date: string | null
}

interface ShoppingItem {
  id: string
  name: string
  category: string
  notes: string | null
  checked: boolean
}

interface AisleData {
  name: string
  emoji: string
  items: Array<{ name: string; qty: string; price: number; reason: string }>
}

interface GeneratedList {
  aisles: AisleData[]
  total_estimated: number
  meals_enabled: string[]
  savings_tip: string
}

const BUDGET_OPTIONS = [30, 50, 80, 120]
const DAYS_OPTIONS = [3, 5, 7]
const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6]

export default function ShoppingClient({
  inventory,
  listItems,
}: {
  inventory: InventoryItem[]
  listItems: ShoppingItem[]
}) {
  const [budget, setBudget] = useState(50)
  const [days, setDays] = useState(5)
  const [people, setPeople] = useState(2)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedList | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const unchecked = listItems.filter(i => !i.checked)
  const checked = listItems.filter(i => i.checked)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setGenerated(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory, budget, days, people }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      if (data.aisles) {
        setGenerated(data)
      } else {
        setError('Non sono riuscito a generare la lista. Riprova.')
      }
    } catch {
      setError('Errore nella generazione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveGenerated() {
    if (!generated) return
    const allItems = generated.aisles.flatMap(a =>
      a.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, aisle: a.name }))
    )
    await saveGeneratedList(allItems)
    setSaved(true)
  }

  function buildExportText() {
    if (generated) {
      let text = '🛒 Lista della spesa\n\n'
      for (const aisle of generated.aisles) {
        text += `${aisle.emoji} ${aisle.name}:\n`
        for (const item of aisle.items) {
          text += `☐ ${item.name} (${item.qty})\n`
        }
        text += '\n'
      }
      text += `💰 Totale stimato: €${generated.total_estimated.toFixed(2)}`
      return text
    }
    let text = '🛒 Lista della spesa\n\n'
    for (const item of unchecked) {
      text += `☐ ${item.name}${item.notes ? ` (${item.notes})` : ''}\n`
    }
    return text.trim()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildExportText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const text = buildExportText()
    if (navigator.share) {
      try { await navigator.share({ title: 'Lista della spesa', text }) } catch { /* cancelled */ }
    } else {
      await handleCopy()
    }
  }

  async function handleToggle(id: string, isChecked: boolean) {
    setPendingId(id)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('checked', String(isChecked))
    try { await toggleShoppingItem(fd) } finally { setPendingId(null) }
  }

  async function handleDelete(id: string) {
    setPendingId(id)
    const fd = new FormData()
    fd.set('id', id)
    try { await deleteShoppingItem(fd) } finally { setPendingId(null) }
  }

  async function handleAddCustom() {
    if (!addName.trim()) return
    const fd = new FormData()
    fd.set('name', addName.trim())
    fd.set('category', 'General')
    await addShoppingItem(fd)
    setAddName('')
    setShowAddForm(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-olive-600" />
            Lista della spesa
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unchecked.length > 0 ? `${unchecked.length} da comprare` : 'Genera una lista smart dal tuo frigo'}
          </p>
        </div>
        {(unchecked.length > 0 || generated) && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`p-2 rounded-xl transition-all ${copied ? 'bg-olive-100 text-olive-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Copia per Google Keep"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-olive-600 text-white hover:bg-olive-700 transition-all active:scale-95"
              title="Condividi"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Smart Generation */}
      <div className="bg-gradient-to-br from-olive-50 to-emerald-50 rounded-2xl border border-olive-200/50 p-5 mb-6">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-olive-600" />
          Genera spesa intelligente
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Analizza il frigo e suggerisce cosa comprare per {days} giorni, nel tuo budget.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Budget</label>
            <div className="flex flex-wrap gap-1">
              {BUDGET_OPTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${budget === b ? 'bg-olive-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  €{b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Giorni</label>
            <div className="flex gap-1">
              {DAYS_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${days === d ? 'bg-olive-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {d}g
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Persone</label>
            <div className="flex flex-wrap gap-1">
              {PEOPLE_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeople(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${people === p ? 'bg-olive-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-olive-600 hover:bg-olive-700 text-white rounded-xl py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Genero la spesa...</> : <><Sparkles className="w-4 h-4" /> Genera lista smart</>}
        </button>
        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
      </div>

      {/* Generated List */}
      {generated && (
        <div className="mb-6 space-y-3 animate-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5" /> Pasti che potrai preparare
            </p>
            <div className="flex flex-wrap gap-1.5">
              {generated.meals_enabled.map(m => (
                <span key={m} className="text-xs bg-olive-50 text-olive-700 px-2.5 py-1 rounded-full font-medium">{m}</span>
              ))}
            </div>
          </div>

          {generated.savings_tip && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200/50 px-4 py-3 flex items-start gap-2">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{generated.savings_tip}</p>
            </div>
          )}

          {generated.aisles.map(aisle => (
            <div key={aisle.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">{aisle.emoji} {aisle.name}</h3>
                <span className="text-xs text-slate-400">{aisle.items.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {aisle.items.map(item => (
                  <div key={item.name} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.qty} · {item.reason}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 shrink-0 ml-2">€{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-olive-600 rounded-2xl p-5 text-white text-center">
            <p className="text-olive-200 text-xs font-bold uppercase tracking-wider">Totale stimato</p>
            <p className="text-3xl font-bold mt-1">€{generated.total_estimated.toFixed(2)}</p>
            <p className="text-olive-200 text-xs mt-1">Budget: €{budget} · {days} giorni · {people} persone</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveGenerated}
                disabled={saved}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${saved ? 'bg-white/20 text-white' : 'bg-white text-olive-700 hover:bg-olive-50'}`}
              >
                {saved ? '✓ Salvata' : 'Salva nella lista'}
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
              >
                {copied ? '✓' : '📋'} Keep
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current List */}
      {unchecked.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Da comprare ({unchecked.length})</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs font-semibold text-olive-600 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Aggiungi
            </button>
          </div>
          {showAddForm && (
            <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                placeholder="Aggiungi prodotto..."
                autoFocus
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-olive-500"
              />
              <button onClick={handleAddCustom} className="text-olive-600 p-2"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setShowAddForm(false); setAddName('') }} className="text-slate-400 p-2"><X className="w-4 h-4" /></button>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {unchecked.map(item => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${pendingId === item.id ? 'opacity-50' : ''}`}>
                <button onClick={() => handleToggle(item.id, item.checked)} className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0 hover:border-olive-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  {item.notes && <p className="text-[11px] text-slate-400 truncate">{item.notes}</p>}
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-400 p-1 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checked */}
      {checked.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400">Già presi ({checked.length})</h2>
            <form action={clearCheckedItems}>
              <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-600">Elimina presi</button>
            </form>
          </div>
          <div className="divide-y divide-slate-100">
            {checked.map(item => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 ${pendingId === item.id ? 'opacity-50' : ''}`}>
                <button onClick={() => handleToggle(item.id, item.checked)} className="w-5 h-5 rounded-md bg-olive-600 border-2 border-olive-600 shrink-0 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </button>
                <p className="text-sm text-slate-400 line-through truncate flex-1">{item.name}</p>
                <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-400 p-1 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {unchecked.length === 0 && !generated && (
        <div className="text-center py-10">
          <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">La lista è vuota.</p>
          <p className="text-slate-400 text-sm">Usa il generatore sopra per creare una spesa smart!</p>
        </div>
      )}
    </div>
  )
}
