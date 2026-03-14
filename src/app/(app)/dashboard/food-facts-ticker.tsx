'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Lightbulb, BookOpen } from 'lucide-react'

/* ── Data ─────────────────────────────────────────────── */

interface FoodFact {
  id: number
  chip: string
  fact: string
  emoji: string
}

interface Flashcard {
  id: number
  question: string
  answer: string
  emoji: string
  category: string
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

const FLASHCARDS: Flashcard[] = [
  { id: 1, question: 'Quanto dura il pollo crudo in frigo?', answer: '1-2 giorni massimo a 4°C. Nel freezer fino a 9 mesi.', emoji: '🍗', category: 'Conservazione' },
  { id: 2, question: 'Si possono congelare le uova?', answer: 'Sì! Sgusciale, sbattile e congelale in contenitori. Durano fino a 12 mesi.', emoji: '🥚', category: 'Conservazione' },
  { id: 3, question: 'Come capire se un uovo è fresco?', answer: 'Immergilo in acqua: se affonda è fresco, se galleggia è vecchio (ma non necessariamente cattivo).', emoji: '🥚', category: 'Trucchi' },
  { id: 4, question: 'Qual è il cibo più sprecato al mondo?', answer: 'Il pane. In Europa il 30% del pane prodotto finisce nella spazzatura.', emoji: '🍞', category: 'Sprechi' },
  { id: 5, question: 'Come conservare il basilico fresco?', answer: 'Come un bouquet: steli in acqua, a temperatura ambiente, lontano dalla luce diretta. Non in frigo!', emoji: '🌿', category: 'Trucchi' },
  { id: 6, question: 'Il miele scade?', answer: 'No! Il miele non scade mai. Se cristallizza, basta scaldarlo a bagnomaria.', emoji: '🍯', category: 'Conservazione' },
  { id: 7, question: 'Quanta CO2 produce lo spreco alimentare?', answer: 'L\'8-10% delle emissioni globali di gas serra. Se fosse un Paese, sarebbe il 3° più inquinante.', emoji: '🏭', category: 'Ambiente' },
  { id: 8, question: 'Come far durare di più le fragole?', answer: 'Lavale con una soluzione di acqua e aceto (3:1), asciugale bene e conserva in frigo su carta assorbente.', emoji: '🍓', category: 'Trucchi' },
  { id: 9, question: 'Cosa significa "shelf life"?', answer: 'Il periodo in cui un alimento mantiene qualità e sicurezza nelle condizioni di conservazione indicate.', emoji: '📚', category: 'Definizioni' },
  { id: 10, question: 'Quanto cibo basta per sfamare chi ha fame nel mondo?', answer: 'Lo spreco alimentare globale (1.3 mld tonnellate/anno) basterebbe a sfamare 2 miliardi di persone.', emoji: '🌎', category: 'Sprechi' },
  { id: 11, question: 'Come congelare correttamente?', answer: 'Porziona, elimina l\'aria dal sacchetto, etichetta con data e contenuto. Congela piatto per risparmiare spazio.', emoji: '🧊', category: 'Conservazione' },
  { id: 12, question: 'Perché non ricongelare un cibo scongelato?', answer: 'I batteri si moltiplicano durante lo scongelamento. Ricongelare può portare a livelli pericolosi di contaminazione.', emoji: '⚠️', category: 'Sicurezza' },
]

/* ── Component ────────────────────────────────────────── */

export default function FoodFactsTicker() {
  const [activeFact, setActiveFact] = useState<FoodFact | null>(null)
  const [readFactIds, setReadFactIds] = useState<Set<number>>(new Set())
  const [readCardIds, setReadCardIds] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [showScoreBump, setShowScoreBump] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ks-knowledge-score')
    const savedFacts = localStorage.getItem('ks-read-facts')
    const savedCards = localStorage.getItem('ks-read-cards')
    if (saved) setScore(parseInt(saved))
    if (savedFacts) setReadFactIds(new Set(JSON.parse(savedFacts)))
    if (savedCards) setReadCardIds(new Set(JSON.parse(savedCards)))
  }, [])

  const addScore = useCallback((points: number) => {
    setScore((prev) => {
      const next = prev + points
      localStorage.setItem('ks-knowledge-score', String(next))
      return next
    })
    setShowScoreBump(true)
    setTimeout(() => setShowScoreBump(false), 1200)
  }, [])

  function handleChipClick(fact: FoodFact) {
    setActiveFact(fact)
    if (!readFactIds.has(fact.id)) {
      const next = new Set(readFactIds)
      next.add(fact.id)
      setReadFactIds(next)
      localStorage.setItem('ks-read-facts', JSON.stringify([...next]))
      addScore(10)
    }
  }

  function handleFlip() {
    if (!flipped) {
      setFlipped(true)
      const card = FLASHCARDS[currentCard]
      if (!readCardIds.has(card.id)) {
        const next = new Set(readCardIds)
        next.add(card.id)
        setReadCardIds(next)
        localStorage.setItem('ks-read-cards', JSON.stringify([...next]))
        addScore(15)
      }
    } else {
      setFlipped(false)
    }
  }

  function nextCard() {
    setFlipped(false)
    setCurrentCard((prev) => (prev + 1) % FLASHCARDS.length)
  }

  function prevCard() {
    setFlipped(false)
    setCurrentCard((prev) => (prev - 1 + FLASHCARDS.length) % FLASHCARDS.length)
  }

  const card = FLASHCARDS[currentCard]

  // Split facts into 3 rows for multi-line ticker
  const row1 = FOOD_FACTS.filter((_, i) => i % 3 === 0)
  const row2 = FOOD_FACTS.filter((_, i) => i % 3 === 1)
  const row3 = FOOD_FACTS.filter((_, i) => i % 3 === 2)

  return (
    <>
      {/* Full-width breakout wrapper */}
      <div className="-mx-6 md:-mx-6 lg:-mx-12 xl:-mx-20 bg-gradient-to-b from-olive-50/60 to-cream border-y border-olive-100/50 py-5">
        <div className="max-w-7xl mx-auto px-4">
          {/* Score bar */}
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-olive-600" />
              Learn & Discover
            </h2>
            <div className="relative flex items-center gap-1.5 bg-white text-olive-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-olive-200">
              <Brain className="w-3.5 h-3.5" />
              {score} pts
              <AnimatePresence>
                {showScoreBump && (
                  <motion.span
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -24 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute -top-5 right-1 text-olive-600 font-bold text-xs"
                  >
                    +{readCardIds.has(card.id) ? 10 : 15}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
            {/* LEFT — Did you know? Multi-row ticker */}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                <Sparkles className="w-3.5 h-3.5 text-olive-500" />
                Did you know?
                <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">
                  — tap to learn
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {[row1, row2, row3].map((row, rowIdx) => (
                  <div key={rowIdx} className="relative overflow-hidden">
                    {/* Edge fades */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-olive-50/60 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-olive-50/60 to-transparent z-10 pointer-events-none" />

                    <motion.div
                      className="flex gap-2 py-0.5"
                      animate={{ x: rowIdx % 2 === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
                      transition={{
                        x: {
                          duration: 30 + rowIdx * 8,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                      }}
                    >
                      {[...row, ...row].map((fact, i) => {
                        const isRead = readFactIds.has(fact.id)
                        return (
                          <button
                            key={`${fact.id}-${i}`}
                            onClick={() => handleChipClick(fact)}
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-95 border ${
                              isRead
                                ? 'bg-olive-100 border-olive-200 text-olive-800'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-olive-300 hover:shadow-sm'
                            }`}
                          >
                            <span className="text-sm leading-none">{fact.emoji}</span>
                            {fact.chip}
                            {isRead && <span className="w-1.5 h-1.5 rounded-full bg-olive-500 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 mt-2 px-1">
                {readFactIds.size}/{FOOD_FACTS.length} facts discovered
              </p>
            </div>

            {/* RIGHT — Flashcards */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                <BookOpen className="w-3.5 h-3.5 text-olive-500" />
                Flashcards
                <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">
                  — tap to flip
                </span>
              </div>

              {/* Card */}
              <div
                className="relative cursor-pointer select-none"
                style={{ perspective: '1000px' }}
                onClick={handleFlip}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative h-[180px]"
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-olive-600 bg-olive-50 px-2 py-0.5 rounded-full">
                          {card.category}
                        </span>
                        <span className="text-2xl">{card.emoji}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {card.question}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Tap to reveal answer
                    </p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 bg-olive-600 rounded-2xl shadow-sm p-5 flex flex-col justify-between text-white"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-olive-200 bg-olive-700 px-2 py-0.5 rounded-full">
                          {card.category}
                        </span>
                        <span className="text-2xl">{card.emoji}</span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {card.answer}
                      </p>
                    </div>
                    <p className="text-[10px] text-olive-200 text-center">
                      Tap to close
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={prevCard}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {FLASHCARDS.map((c, i) => (
                    <div
                      key={c.id}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === currentCard
                          ? 'bg-olive-600 w-4'
                          : readCardIds.has(c.id)
                            ? 'bg-olive-300'
                            : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextCard}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 text-center">
                {readCardIds.size}/{FLASHCARDS.length} cards mastered
              </p>
            </div>
          </div>
        </div>
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
              <div className="bg-gradient-to-br from-olive-100 via-olive-50 to-cream px-6 pt-6 pb-4 text-center">
                <span className="text-5xl block mb-3">{activeFact.emoji}</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeFact.chip}
                </h3>
              </div>

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

              <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {readFactIds.size}/{FOOD_FACTS.length} discovered
                </span>
                <button
                  onClick={() => setActiveFact(null)}
                  className="inline-flex items-center gap-1.5 bg-olive-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-olive-700 active:scale-95 transition-all"
                >
                  Got it
                </button>
              </div>

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
