'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, ArrowRight } from 'lucide-react'
import { useGamification } from '@/app/(app)/gamification-context'
import { QUIZ_QUESTIONS, FOOD_FACTS, FLASHCARDS } from '@/lib/learn-data'

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function seededIndex(max: number) {
  const day = new Date()
  // Use day-of-year as seed for stable daily rotation
  const dayOfYear =
    Math.floor(
      (day.getTime() - new Date(day.getFullYear(), 0, 0).getTime()) / 86_400_000
    )
  return dayOfYear % max
}

/* ── Sub-components ──────────────────────────────────── */

function QuizChallenge({
  awardXP,
  onComplete,
}: {
  awardXP: (action: string, xp: number, key: string) => boolean
  onComplete: (xp: number) => void
}) {
  const question = QUIZ_QUESTIONS[seededIndex(QUIZ_QUESTIONS.length)]
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  function handleAnswer(index: number) {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    if (index === question.correctIndex) {
      const awarded = awardXP('quiz_correct', 20, `daily_quiz:${todayKey()}`)
      if (awarded) onComplete(20)
    }
  }

  const isCorrect = selected === question.correctIndex

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        <span className="mr-1.5">{question.emoji}</span>
        {question.question}
      </p>

      <div className="grid grid-cols-1 gap-2">
        {question.options.map((option, i) => {
          let style =
            'bg-slate-50 border-slate-200 text-slate-700 hover:border-olive-300'
          if (answered) {
            if (i === question.correctIndex) {
              style = 'bg-emerald-50 border-emerald-400 text-emerald-800'
            } else if (i === selected) {
              style = 'bg-red-50 border-red-300 text-red-700'
            } else {
              style = 'bg-slate-50 border-slate-100 text-slate-400'
            }
          }

          return (
            <motion.button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={`w-full text-left px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${style}`}
              whileTap={!answered ? { scale: 0.98 } : undefined}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs px-3 py-2 rounded-lg ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isCorrect ? 'Correct! ' : 'Not quite. '}
            {question.explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FactChallenge({
  awardXP,
  onComplete,
}: {
  awardXP: (action: string, xp: number, key: string) => boolean
  onComplete: (xp: number) => void
}) {
  const fact = FOOD_FACTS[seededIndex(FOOD_FACTS.length)]
  const [claimed, setClaimed] = useState(false)

  function handleClaim() {
    if (claimed) return
    const awarded = awardXP('fact_read', 5, `daily_fact:${todayKey()}`)
    setClaimed(true)
    if (awarded) onComplete(5)
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-olive-600 uppercase tracking-wider">
        Did you know?
      </p>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{fact.emoji}</span>
        <p className="text-sm text-slate-700 leading-relaxed">{fact.fact}</p>
      </div>
      <button
        onClick={handleClaim}
        disabled={claimed}
        className={`w-full text-center py-2 rounded-xl text-sm font-semibold transition-all ${
          claimed
            ? 'bg-olive-100 text-olive-600'
            : 'bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98]'
        }`}
      >
        {claimed ? 'Learned!' : 'I learned this!'}
      </button>
    </div>
  )
}

function FlashcardChallenge({
  awardXP,
  onComplete,
}: {
  awardXP: (action: string, xp: number, key: string) => boolean
  onComplete: (xp: number) => void
}) {
  const card = FLASHCARDS[seededIndex(FLASHCARDS.length)]
  const [flipped, setFlipped] = useState(false)
  const [claimed, setClaimed] = useState(false)

  function handleClaim() {
    if (claimed) return
    const awarded = awardXP('flashcard_flipped', 5, `daily_card:${todayKey()}`)
    setClaimed(true)
    if (awarded) onComplete(5)
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div
            key="front"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl flex-shrink-0">{card.emoji}</span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {card.question}
              </p>
            </div>
            <button
              onClick={() => setFlipped(true)}
              className="w-full text-center py-2 rounded-xl text-sm font-semibold bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98] transition-all"
            >
              Reveal Answer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-olive-50 rounded-xl px-4 py-3 mb-3">
              <p className="text-xs font-bold text-olive-600 uppercase tracking-wider mb-1">
                Answer
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {card.answer}
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={claimed}
              className={`w-full text-center py-2 rounded-xl text-sm font-semibold transition-all ${
                claimed
                  ? 'bg-olive-100 text-olive-600'
                  : 'bg-olive-600 text-white hover:bg-olive-700 active:scale-[0.98]'
              }`}
            >
              {claimed ? 'Got it!' : 'Got it!'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────── */

export default function DailyChallenge() {
  const { awardXP, hasCompleted } = useGamification()
  const [earnedXP, setEarnedXP] = useState<number | null>(null)

  const challengeType = new Date().getDate() % 3
  const rewardXP = challengeType === 0 ? 20 : 5

  const completionKeys = [
    `daily_quiz:${todayKey()}`,
    `daily_fact:${todayKey()}`,
    `daily_card:${todayKey()}`,
  ]
  const alreadyCompleted = useMemo(
    () => hasCompleted(completionKeys[challengeType]),
    [hasCompleted, challengeType]
  )

  function handleComplete(xp: number) {
    setEarnedXP(xp)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-olive-600" />
          <h3 className="text-sm font-bold text-slate-800">Daily Challenge</h3>
        </div>
        <span className="text-xs font-bold text-olive-600 bg-olive-50 px-2.5 py-1 rounded-full">
          +{rewardXP} XP
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-3">
        {alreadyCompleted || earnedXP !== null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 py-4"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Completed!
              </p>
              <p className="text-xs text-slate-500">
                +{earnedXP ?? rewardXP} XP earned today
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {challengeType === 0 && (
              <QuizChallenge awardXP={awardXP} onComplete={handleComplete} />
            )}
            {challengeType === 1 && (
              <FactChallenge awardXP={awardXP} onComplete={handleComplete} />
            )}
            {challengeType === 2 && (
              <FlashcardChallenge
                awardXP={awardXP}
                onComplete={handleComplete}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <Link
          href="/learn"
          className="flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:underline"
        >
          Explore more
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
