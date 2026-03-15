'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, ArrowRight, BookOpen, Brain, Zap } from 'lucide-react'
import { useGamification } from '@/app/(app)/gamification-context'
import { QUIZ_QUESTIONS, FOOD_FACTS, FLASHCARDS } from '@/lib/learn-data'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function seededIndex(max: number, offset = 0) {
  const day = new Date()
  const dayOfYear = Math.floor(
    (day.getTime() - new Date(day.getFullYear(), 0, 0).getTime()) / 86_400_000
  )
  return (dayOfYear + offset) % max
}

interface ChallengeChip {
  id: string
  label: string
  emoji: string
  type: 'quiz' | 'fact' | 'flashcard'
  xp: number
  dedupeKey: string
}

function buildDailyChips(): ChallengeChip[] {
  const chips: ChallengeChip[] = []
  const today = todayKey()

  // 2 quizzes
  for (let i = 0; i < 2; i++) {
    const q = QUIZ_QUESTIONS[seededIndex(QUIZ_QUESTIONS.length, i * 3)]
    chips.push({
      id: `quiz-${i}`,
      label: `Quiz: ${q.question.slice(0, 30)}...`,
      emoji: q.emoji,
      type: 'quiz',
      xp: 20,
      dedupeKey: `daily_quiz:${today}:${q.id}`,
    })
  }

  // 2 facts
  for (let i = 0; i < 2; i++) {
    const f = FOOD_FACTS[seededIndex(FOOD_FACTS.length, i * 5 + 1)]
    chips.push({
      id: `fact-${i}`,
      label: f.chip,
      emoji: f.emoji,
      type: 'fact',
      xp: 5,
      dedupeKey: `daily_fact:${today}:${f.id}`,
    })
  }

  // 2 flashcards
  for (let i = 0; i < 2; i++) {
    const c = FLASHCARDS[seededIndex(FLASHCARDS.length, i * 7 + 2)]
    chips.push({
      id: `card-${i}`,
      label: c.question.slice(0, 30) + '...',
      emoji: c.emoji,
      type: 'flashcard',
      xp: 5,
      dedupeKey: `daily_card:${today}:${c.id}`,
    })
  }

  return chips
}

export default function DailyChallenge() {
  const { awardXP, hasCompleted } = useGamification()
  const chips = useMemo(() => buildDailyChips(), [])
  const [activeChip, setActiveChip] = useState<ChallengeChip | null>(null)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [factClaimed, setFactClaimed] = useState(false)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cardClaimed, setCardClaimed] = useState(false)
  const [lastEarned, setLastEarned] = useState<number | null>(null)

  const completedCount = chips.filter((c) => hasCompleted(c.dedupeKey)).length
  const allDone = completedCount === chips.length

  function openChip(chip: ChallengeChip) {
    setActiveChip(chip)
    setQuizAnswer(null)
    setQuizDone(false)
    setFactClaimed(false)
    setCardFlipped(false)
    setCardClaimed(false)
    setLastEarned(null)
  }

  function handleQuizAnswer(idx: number, correctIdx: number) {
    if (quizDone) return
    setQuizAnswer(idx)
    setQuizDone(true)
    if (idx === correctIdx && activeChip) {
      const awarded = awardXP('quiz_correct', 20, activeChip.dedupeKey)
      if (awarded) setLastEarned(20)
    }
  }

  function handleFactClaim() {
    if (factClaimed || !activeChip) return
    setFactClaimed(true)
    const awarded = awardXP('fact_read', 5, activeChip.dedupeKey)
    if (awarded) setLastEarned(5)
  }

  function handleCardClaim() {
    if (cardClaimed || !activeChip) return
    setCardClaimed(true)
    const awarded = awardXP('flashcard_flipped', 5, activeChip.dedupeKey)
    if (awarded) setLastEarned(5)
  }

  // Get the actual data item for the active chip
  const activeQuiz = activeChip?.type === 'quiz'
    ? QUIZ_QUESTIONS[seededIndex(QUIZ_QUESTIONS.length, parseInt(activeChip.id.split('-')[1]) * 3)]
    : null
  const activeFact = activeChip?.type === 'fact'
    ? FOOD_FACTS[seededIndex(FOOD_FACTS.length, parseInt(activeChip.id.split('-')[1]) * 5 + 1)]
    : null
  const activeCard = activeChip?.type === 'flashcard'
    ? FLASHCARDS[seededIndex(FLASHCARDS.length, parseInt(activeChip.id.split('-')[1]) * 7 + 2)]
    : null

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-olive-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Daily Challenges
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {completedCount}/{chips.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-olive-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / chips.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Chips row */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {chips.map((chip) => {
          const done = hasCompleted(chip.dedupeKey)
          const isActive = activeChip?.id === chip.id
          return (
            <button
              key={chip.id}
              onClick={() => !done && openChip(chip)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                done
                  ? 'bg-olive-100 text-olive-600 border border-olive-200'
                  : isActive
                    ? 'bg-olive-600 text-white shadow-sm border border-olive-600'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-olive-300 hover:bg-olive-50 active:scale-95'
              }`}
            >
              {done ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="text-sm leading-none">{chip.emoji}</span>
              )}
              {chip.type === 'quiz' && <Brain className="w-3 h-3" />}
              {chip.type === 'fact' && <BookOpen className="w-3 h-3" />}
              {chip.type === 'flashcard' && <Zap className="w-3 h-3" />}
              <span className="max-w-[100px] truncate">{chip.emoji} {chip.type === 'quiz' ? 'Quiz' : chip.type === 'fact' ? chip.label : 'Flashcard'}</span>
              {!done && (
                <span className="text-[10px] opacity-70">+{chip.xp}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active challenge content */}
      <AnimatePresence mode="wait">
        {activeChip && !hasCompleted(activeChip.dedupeKey) && (
          <motion.div
            key={activeChip.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-slate-100">
              {/* Quiz */}
              {activeQuiz && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {activeQuiz.emoji} {activeQuiz.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {activeQuiz.options.map((opt, i) => {
                      let cls = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-olive-300'
                      if (quizDone) {
                        if (i === activeQuiz.correctIndex) cls = 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        else if (i === quizAnswer) cls = 'bg-red-50 border-red-300 text-red-700'
                        else cls = 'bg-slate-50 border-slate-100 text-slate-400'
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handleQuizAnswer(i, activeQuiz.correctIndex)}
                          disabled={quizDone}
                          className={`w-full text-left px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${cls}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {quizDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs px-3 py-2 rounded-lg ${
                        quizAnswer === activeQuiz.correctIndex
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {activeQuiz.explanation}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Fact */}
              {activeFact && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-olive-600 uppercase tracking-wider">
                    Did you know?
                  </p>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{activeFact.emoji}</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{activeFact.fact}</p>
                  </div>
                  <button
                    onClick={handleFactClaim}
                    disabled={factClaimed}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                      factClaimed
                        ? 'bg-olive-100 text-olive-600'
                        : 'bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98]'
                    }`}
                  >
                    {factClaimed ? 'Learned!' : 'I learned this! +5 XP'}
                  </button>
                </div>
              )}

              {/* Flashcard */}
              {activeCard && (
                <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {!cardFlipped ? (
                      <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl flex-shrink-0">{activeCard.emoji}</span>
                          <p className="text-sm font-semibold text-slate-800">{activeCard.question}</p>
                        </div>
                        <button
                          onClick={() => setCardFlipped(true)}
                          className="w-full py-2 rounded-xl text-sm font-semibold bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98] transition-all"
                        >
                          Reveal Answer
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="bg-olive-50 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-bold text-olive-600 uppercase mb-1">Answer</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{activeCard.answer}</p>
                        </div>
                        <button
                          onClick={handleCardClaim}
                          disabled={cardClaimed}
                          className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                            cardClaimed
                              ? 'bg-olive-100 text-olive-600'
                              : 'bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98]'
                          }`}
                        >
                          {cardClaimed ? 'Got it!' : 'Got it! +5 XP'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* XP earned feedback */}
              <AnimatePresence>
                {lastEarned && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-center text-sm font-bold text-olive-600"
                  >
                    +{lastEarned} XP earned!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All done state */}
      {allDone && !activeChip && (
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600">
            All challenges completed today! Come back tomorrow.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <Link
          href="/learn"
          className="flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:underline"
        >
          Explore more challenges
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
