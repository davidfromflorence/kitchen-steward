'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
  Star,
  Sparkles,
  Brain,
  Lightbulb,
  Bookmark,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useGamification } from '@/app/(app)/gamification-context'
import { FOOD_FACTS, FLASHCARDS, QUIZ_QUESTIONS } from '@/lib/learn-data'

/* ------------------------------------------------------------------ */
/*  Quiz Tab                                                          */
/* ------------------------------------------------------------------ */

function QuizTab() {
  const { awardXP, hasCompleted, toggleSaved, isSaved } = useGamification()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const question = QUIZ_QUESTIONS[currentIndex]
  const isCorrect = selectedAnswer === question.correctIndex
  const completedCount = QUIZ_QUESTIONS.filter((q) =>
    hasCompleted(`quiz:${q.id}`)
  ).length

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (showResult) return
      setSelectedAnswer(answerIndex)
      setShowResult(true)

      if (answerIndex === question.correctIndex) {
        awardXP('quiz_correct', 20, `quiz:${question.id}`)
        // Auto-advance after 1.5s on correct answer
        setTimeout(() => {
          if (currentIndex < QUIZ_QUESTIONS.length - 1) {
            setCurrentIndex((prev) => prev + 1)
            setSelectedAnswer(null)
            setShowResult(false)
          }
        }, 1500)
      }
    },
    [showResult, question, awardXP, currentIndex]
  )

  const goTo = useCallback(
    (dir: 'prev' | 'next') => {
      const next =
        dir === 'prev'
          ? Math.max(0, currentIndex - 1)
          : Math.min(QUIZ_QUESTIONS.length - 1, currentIndex + 1)
      setCurrentIndex(next)
      setSelectedAnswer(null)
      setShowResult(false)
    },
    [currentIndex]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">
            {completedCount}/{QUIZ_QUESTIONS.length} completed
          </span>
          <Badge variant="secondary" className="text-xs">
            +20 XP each
          </Badge>
        </div>
        <Progress
          value={
            QUIZ_QUESTIONS.length > 0
              ? (completedCount / QUIZ_QUESTIONS.length) * 100
              : 0
          }
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
        >
          {/* Question number + completed badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
            </span>
            {hasCompleted(`quiz:${question.id}`) && (
              <div className="w-5 h-5 rounded-full bg-olive-600 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-6">
            {question.question}
          </h3>

          {/* 2x2 option grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, idx) => {
              let bg = 'bg-slate-50 border-slate-200 hover:border-olive-300'
              let text = 'text-slate-700'

              if (showResult) {
                if (idx === question.correctIndex) {
                  bg = 'bg-emerald-50 border-emerald-400'
                  text = 'text-emerald-800'
                } else if (idx === selectedAnswer && !isCorrect) {
                  bg = 'bg-red-50 border-red-400'
                  text = 'text-red-800'
                } else {
                  bg = 'bg-slate-50 border-slate-200 opacity-50'
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`relative rounded-2xl border-2 p-4 text-left text-sm font-medium transition-all ${bg} ${text} ${
                    !showResult ? 'active:scale-[0.98] cursor-pointer' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </span>

                  {/* Correct indicator */}
                  {showResult && idx === question.correctIndex && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <Check
                        className="w-5 h-5 text-emerald-600"
                        strokeWidth={3}
                      />
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Result feedback */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center justify-center gap-2"
            >
              {isCorrect ? (
                <>
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="inline-flex items-center gap-1.5 bg-olive-100 text-olive-700 px-3 py-1.5 rounded-full text-sm font-bold"
                  >
                    <Sparkles className="w-4 h-4" />
                    +20 XP
                  </motion.span>
                </>
              ) : (
                <span className="text-sm text-red-500 font-medium">
                  Riprova la prossima volta
                </span>
              )}
              <button
                onClick={() => toggleSaved(`quiz:${question.id}`)}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-olive-600 transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isSaved(`quiz:${question.id}`) ? 'fill-olive-600 text-olive-600' : ''}`} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goTo('prev')}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => goTo('next')}
          disabled={currentIndex === QUIZ_QUESTIONS.length - 1}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:text-olive-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Flashcards Tab                                                    */
/* ------------------------------------------------------------------ */

function FlashcardsTab() {
  const { awardXP, hasCompleted, toggleSaved, isSaved } = useGamification()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const card = FLASHCARDS[currentIndex]
  const masteredCount = FLASHCARDS.filter((c) =>
    hasCompleted(`card:${c.id}`)
  ).length

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      awardXP('flashcard_flipped', 5, `card:${card.id}`)
    }
    setIsFlipped((prev) => !prev)
  }, [isFlipped, awardXP, card.id])

  const goTo = useCallback(
    (dir: 'prev' | 'next') => {
      const next =
        dir === 'prev'
          ? Math.max(0, currentIndex - 1)
          : Math.min(FLASHCARDS.length - 1, currentIndex + 1)
      setCurrentIndex(next)
      setIsFlipped(false)
    },
    [currentIndex]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">
            {masteredCount}/{FLASHCARDS.length} mastered
          </span>
          <Badge variant="secondary" className="text-xs">
            +5 XP each
          </Badge>
        </div>
        <Progress
          value={
            FLASHCARDS.length > 0
              ? (masteredCount / FLASHCARDS.length) * 100
              : 0
          }
        />
      </div>

      {/* Flashcard */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-full max-w-md cursor-pointer"
          style={{ perspective: 1000 }}
          onClick={handleFlip}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full min-h-[280px]"
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl border-2 border-slate-200 bg-white shadow-sm p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-5xl mb-4">{card.emoji}</span>
              <Badge variant="outline" className="mb-4 text-xs">
                {card.category}
              </Badge>
              <h3 className="text-lg font-bold text-slate-800">
                {card.question}
              </h3>
              <p className="text-xs text-slate-400 mt-4">Tap to flip</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl bg-olive-600 shadow-sm p-8 flex flex-col items-center justify-center text-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <p className="text-white text-base font-medium leading-relaxed">
                {card.answer}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSaved(`card:${card.id}`) }}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isSaved(`card:${card.id}`) ? 'fill-white' : ''}`} />
                {isSaved(`card:${card.id}`) ? 'Salvata' : 'Salva'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Navigation arrows + dot indicators */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <button
            onClick={() => goTo('prev')}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
            {FLASHCARDS.map((c, idx) => {
              const mastered = hasCompleted(`card:${c.id}`)
              const active = idx === currentIndex
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCurrentIndex(idx)
                    setIsFlipped(false)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    active
                      ? 'w-6 bg-olive-600'
                      : mastered
                        ? 'bg-olive-400'
                        : 'bg-slate-200'
                  }`}
                />
              )
            })}
          </div>

          <button
            onClick={() => goTo('next')}
            disabled={currentIndex === FLASHCARDS.length - 1}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Food Facts Tab                                                    */
/* ------------------------------------------------------------------ */

function FoodFactsTab() {
  const { awardXP, hasCompleted, toggleSaved, isSaved } = useGamification()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const discoveredCount = FOOD_FACTS.filter((f) =>
    hasCompleted(`fact:${f.id}`)
  ).length

  const handleExpand = useCallback(
    (factId: string) => {
      if (expandedId === factId) {
        setExpandedId(null)
        return
      }
      setExpandedId(factId)
      awardXP('fact_read', 5, `fact:${factId}`)
    },
    [expandedId, awardXP]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">
            {discoveredCount}/{FOOD_FACTS.length} discovered
          </span>
          <Badge variant="secondary" className="text-xs">
            +5 XP each
          </Badge>
        </div>
        <Progress
          value={
            FOOD_FACTS.length > 0
              ? (discoveredCount / FOOD_FACTS.length) * 100
              : 0
          }
        />
      </div>

      {/* Facts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FOOD_FACTS.map((fact) => {
          const read = hasCompleted(`fact:${fact.id}`)
          const expanded = expandedId === String(fact.id)

          return (
            <motion.button
              key={fact.id}
              layout
              onClick={() => handleExpand(String(fact.id))}
              className={`relative rounded-2xl border-2 p-4 text-left transition-colors ${
                expanded
                  ? 'col-span-2 md:col-span-1 bg-olive-50 border-olive-300'
                  : read
                    ? 'bg-olive-50 border-olive-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Read checkmark */}
              {read && !expanded && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-olive-600 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}

              <span className="text-2xl block mb-2">{fact.emoji}</span>
              <span className="text-xs font-semibold text-slate-500 mb-2 block">
                {fact.chip}
              </span>

              <AnimatePresence mode="wait">
                {expanded ? (
                  <motion.div
                    key="full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <p className="text-sm text-slate-700 leading-relaxed mt-1">
                      {fact.fact}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSaved(`fact:${fact.id}`) }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-olive-600 hover:text-olive-700 transition-colors"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved(`fact:${fact.id}`) ? 'fill-olive-600' : ''}`} />
                      {isSaved(`fact:${fact.id}`) ? 'Salvato' : 'Salva'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.p
                    key="truncated"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-slate-500 line-clamp-2 mt-1"
                  >
                    {fact.fact}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Saved Tab                                                         */
/* ------------------------------------------------------------------ */

function SavedTab() {
  const { savedItems, toggleSaved } = useGamification()

  const savedQuizzes = QUIZ_QUESTIONS.filter((q) => savedItems.includes(`quiz:${q.id}`))
  const savedCards = FLASHCARDS.filter((c) => savedItems.includes(`card:${c.id}`))
  const savedFacts = FOOD_FACTS.filter((f) => savedItems.includes(`fact:${f.id}`))

  const isEmpty = savedQuizzes.length === 0 && savedCards.length === 0 && savedFacts.length === 0

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Nessun elemento salvato.</p>
        <p className="text-slate-400 text-xs mt-1">Salva quiz, flashcard e curiosità per rivederli qui.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {savedCards.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Flashcard</h3>
          <div className="flex flex-col gap-2">
            {savedCards.map((card) => (
              <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
                <span className="text-xl">{card.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{card.question}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.answer}</p>
                </div>
                <button onClick={() => toggleSaved(`card:${card.id}`)} className="text-olive-600 hover:text-red-500 transition-colors shrink-0">
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedQuizzes.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quiz</h3>
          <div className="flex flex-col gap-2">
            {savedQuizzes.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
                <span className="text-xl">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <p className="text-xs text-emerald-600 mt-1">{q.options[q.correctIndex]}</p>
                  {q.explanation && <p className="text-xs text-slate-400 mt-0.5">{q.explanation}</p>}
                </div>
                <button onClick={() => toggleSaved(`quiz:${q.id}`)} className="text-olive-600 hover:text-red-500 transition-colors shrink-0">
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedFacts.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Curiosità</h3>
          <div className="flex flex-col gap-2">
            {savedFacts.map((fact) => (
              <div key={fact.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
                <span className="text-xl">{fact.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{fact.chip}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{fact.fact}</p>
                </div>
                <button onClick={() => toggleSaved(`fact:${fact.id}`)} className="text-olive-600 hover:text-red-500 transition-colors shrink-0">
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Learn Client                                                 */
/* ------------------------------------------------------------------ */

export default function LearnClient() {
  const { totalXP, level, hasCompleted, savedItems } = useGamification()

  const statsFactsDiscovered = FOOD_FACTS.filter((f) =>
    hasCompleted(`fact:${f.id}`)
  ).length
  const statsCardsMastered = FLASHCARDS.filter((c) =>
    hasCompleted(`card:${c.id}`)
  ).length
  const statsQuizzesPassed = QUIZ_QUESTIONS.filter((q) =>
    hasCompleted(`quiz:${q.id}`)
  ).length

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-4xl mx-auto px-6 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-olive-600" />
          Learn
        </h1>
        <p className="text-slate-500 mt-1">
          Earn XP by exploring food knowledge
        </p>
      </div>

      {/* ── XP Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            icon: Star,
            label: 'Total XP',
            value: totalXP.toLocaleString(),
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
          {
            icon: Sparkles,
            label: 'Level',
            value: level,
            color: 'text-olive-600',
            bg: 'bg-olive-50',
          },
          {
            icon: Lightbulb,
            label: 'Facts',
            value: `${statsFactsDiscovered}/${FOOD_FACTS.length}`,
            color: 'text-sky-500',
            bg: 'bg-sky-50',
          },
          {
            icon: Brain,
            label: 'Cards',
            value: `${statsCardsMastered}/${FLASHCARDS.length}`,
            color: 'text-violet-500',
            bg: 'bg-violet-50',
          },
          {
            icon: Check,
            label: 'Quizzes',
            value: `${statsQuizzesPassed}/${QUIZ_QUESTIONS.length}`,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center text-center"
          >
            <div
              className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mb-2`}
            >
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold text-slate-800">{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={0}>
        <TabsList className="w-full">
          <TabsTrigger value={0} className="flex-1 gap-1.5">
            <Brain className="w-4 h-4" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value={1} className="flex-1 gap-1.5">
            <Sparkles className="w-4 h-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value={2} className="flex-1 gap-1.5">
            <Lightbulb className="w-4 h-4" />
            Facts
          </TabsTrigger>
          <TabsTrigger value={3} className="flex-1 gap-1.5">
            <Bookmark className="w-4 h-4" />
            Salvati{savedItems.length > 0 && ` (${savedItems.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-6">
          <QuizTab />
        </TabsContent>
        <TabsContent value={1} className="mt-6">
          <FlashcardsTab />
        </TabsContent>
        <TabsContent value={2} className="mt-6">
          <FoodFactsTab />
        </TabsContent>
        <TabsContent value={3} className="mt-6">
          <SavedTab />
        </TabsContent>
      </Tabs>

      {/* ── Bottom Link ── */}
      <div className="text-center pt-2">
        <Link
          href="/badges"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:text-olive-700 hover:underline transition-colors"
        >
          View your achievements
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
