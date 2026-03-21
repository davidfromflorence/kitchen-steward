'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

interface SwipeableCardProps {
  children: ReactNode
  onDelete: () => void
  disabled?: boolean
}

const THRESHOLD = 80
const DELETE_THRESHOLD = 140

export default function SwipeableCard({ children, onDelete, disabled }: SwipeableCardProps) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)

  function handleTouchStart(e: React.TouchEvent) {
    if (disabled) return
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping || disabled) return
    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current
    // Only allow left swipe, with resistance
    if (diff > 0) {
      setOffset(Math.min(diff * 0.8, DELETE_THRESHOLD + 20))
    } else {
      setOffset(0)
    }
  }

  function handleTouchEnd() {
    if (!swiping || disabled) return
    setSwiping(false)

    if (offset >= DELETE_THRESHOLD) {
      // Full swipe — delete
      setOffset(300) // animate off-screen
      setTimeout(() => {
        onDelete()
        setOffset(0)
      }, 200)
    } else {
      // Snap back
      setOffset(0)
    }
  }

  const showDelete = offset > THRESHOLD / 2
  const isFullSwipe = offset >= DELETE_THRESHOLD

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 rounded-2xl transition-colors ${
          isFullSwipe ? 'bg-red-600' : 'bg-red-500'
        }`}
      >
        {showDelete && (
          <div className="flex items-center gap-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {isFullSwipe ? 'Rilascia' : 'Elimina'}
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
