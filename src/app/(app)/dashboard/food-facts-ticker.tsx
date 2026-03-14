'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, Sparkles } from 'lucide-react'

interface FoodFact {
  id: number
  chip: string
  fact: string
  emoji: string
}

const FOOD_FACTS: FoodFact[] = [
  { id: 1, chip: 'Banane & Mele', emoji: '🍌', fact: 'Le mele rilasciano etilene che fa maturare le banane 2x più velocemente. Conservale separate!' },
  { id: 2, chip: '1/3 del cibo', emoji: '🌍', fact: 'Ogni anno si spreca 1/3 di tutto il cibo prodotto al mondo: 1.3 miliardi di tonnellate.' },
  { id: 3, chip: 'Acqua nascosta', emoji: '💧', fact: 'Buttare 1 kg di manzo equivale a sprecare 15.000 litri d\'acqua usati per produrlo.' },
  { id: 4, chip: 'Frigorifero', emoji: '❄️', fact: 'La temperatura ideale del frigo è 1-4°C. Ogni grado in più riduce la shelf life del 50%.' },
  { id: 5, chip: 'Pane raffermo', emoji: '🍞', fact: 'Il pane raffermo si rigenera in forno a 180°C per 5 minuti avvolto in alluminio.' },
  { id: 6, chip: 'Metano', emoji: '♻️', fact: 'Il cibo in discarica produce metano, un gas serra 80x più potente della CO2.' },
  { id: 7, chip: 'Congelamento', emoji: '🧊', fact: 'Quasi tutti gli alimenti possono essere congelati. Il latte dura fino a 3 mesi in freezer.' },
  { id: 8, chip: 'Erbe fresche', emoji: '🌿', fact: 'Metti le erbe aromatiche in un bicchiere d\'acqua in frigo: durano fino a 2 settimane.' },
  { id: 9, chip: 'Spreco in Italia', emoji: '🇮🇹', fact: 'In Italia ogni persona spreca circa 65 kg di cibo all\'anno, per un valore di €250.' },
  { id: 10, chip: 'Scadenza vs TMC', emoji: '📅', fact: '"Da consumarsi preferibilmente entro" non significa scaduto! Molti cibi sono ancora buoni.' },
  { id: 11, chip: 'Avanzi creativi', emoji: '👨‍🍳', fact: 'Le migliori ricette della tradizione (ribollita, panzanella) nascono dal riuso degli avanzi.' },
  { id: 12, chip: 'Pomodori', emoji: '🍅', fact: 'Non mettere i pomodori in frigo! Perdono sapore e consistenza. Meglio a temperatura ambiente.' },
  { id: 13, chip: 'Food sharing', emoji: '🤝', fact: 'Le app di food sharing hanno salvato oltre 200 milioni di pasti dallo spreco nel 2024.' },
  { id: 14, chip: 'Patate & cipolle', emoji: '🥔', fact: 'Patate e cipolle insieme germogliano più velocemente. Conservale in posti separati e bui.' },
  { id: 15, chip: 'Compostaggio', emoji: '🌱', fact: 'Compostare i rifiuti organici riduce i rifiuti in discarica del 30% e crea fertilizzante gratis.' },
  { id: 16, chip: 'Riso avanzato', emoji: '🍚', fact: 'Il riso avanzato va refrigerato entro 1 ora. Riscaldalo a 70°C+ per eliminare i batteri.' },
  { id: 17, chip: 'Foglie di carota', emoji: '🥕', fact: 'Le foglie di carota sono commestibili e ricche di vitamina K. Perfette per pesto e insalate.' },
  { id: 18, chip: 'Plastica & cibo', emoji: '🔬', fact: 'Ogni settimana ingeriamo circa 5g di microplastiche — quanto una carta di credito.' },
  { id: 19, chip: 'Caffè', emoji: '☕', fact: 'I fondi di caffè sono un ottimo fertilizzante per piante acidofile come azalee e mirtilli.' },
  { id: 20, chip: 'FIFO', emoji: '📦', fact: 'Usa il metodo FIFO (First In, First Out): metti i cibi nuovi dietro quelli vecchi in frigo.' },
]

export default function FoodFactsTicker() {
  const [activeFact, setActiveFact] = useState<FoodFact | null>(null)
  const [readIds, setReadIds] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [showScoreBump, setShowScoreBump] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  // Load score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ks-knowledge-score')
    const savedIds = localStorage.getItem('ks-read-facts')
    if (saved) setScore(parseInt(saved))
    if (savedIds) setReadIds(new Set(JSON.parse(savedIds)))
  }, [])

  function handleChipClick(fact: FoodFact) {
    setActiveFact(fact)

    if (!readIds.has(fact.id)) {
      const newReadIds = new Set(readIds)
      newReadIds.add(fact.id)
      setReadIds(newReadIds)

      const newScore = score + 10
      setScore(newScore)
      setShowScoreBump(true)
      setTimeout(() => setShowScoreBump(false), 1200)

      localStorage.setItem('ks-knowledge-score', String(newScore))
      localStorage.setItem('ks-read-facts', JSON.stringify([...newReadIds]))
    }
  }

  // Duplicate facts for seamless infinite scroll
  const doubled = [...FOOD_FACTS, ...FOOD_FACTS]

  return (
    <>
      {/* Score badge */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-olive-500" />
          Did you know?
        </div>
        <div className="relative flex items-center gap-1.5 bg-olive-50 text-olive-700 px-2.5 py-1 rounded-full text-xs font-bold">
          <Brain className="w-3.5 h-3.5" />
          {score} pts
          <AnimatePresence>
            {showScoreBump && (
              <motion.span
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute -top-4 right-0 text-olive-600 font-bold text-xs"
              >
                +10
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ticker */}
      <div className="relative overflow-hidden -mx-6" ref={tickerRef}>
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-2.5 py-1 px-6"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          {doubled.map((fact, i) => {
            const isRead = readIds.has(fact.id)
            return (
              <button
                key={`${fact.id}-${i}`}
                onClick={() => handleChipClick(fact)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
                  isRead
                    ? 'bg-olive-50 border-olive-200 text-olive-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-olive-300 hover:bg-olive-50/50'
                }`}
              >
                <span className="text-base leading-none">{fact.emoji}</span>
                {fact.chip}
                {isRead && (
                  <span className="w-1.5 h-1.5 rounded-full bg-olive-500" />
                )}
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* Flash Fact overlay */}
      <AnimatePresence>
        {activeFact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setActiveFact(null)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden"
            >
              {/* Header gradient */}
              <div className="bg-gradient-to-br from-olive-100 via-olive-50 to-cream px-6 pt-6 pb-4 text-center">
                <span className="text-5xl block mb-3">{activeFact.emoji}</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeFact.chip}
                </h3>
              </div>

              {/* Fact content */}
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-4 h-4 text-olive-600" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeFact.fact}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {readIds.size}/{FOOD_FACTS.length} curiosities
                </span>
                <button
                  onClick={() => setActiveFact(null)}
                  className="inline-flex items-center gap-1.5 bg-olive-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-olive-700 active:scale-95 transition-all"
                >
                  Got it
                </button>
              </div>

              {/* Close */}
              <button
                onClick={() => setActiveFact(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
