"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud } from "lucide-react"

interface FloatingProgressWidgetProps {
  uploadingCount: number
  totalCount: number
}

export function FloatingProgressWidget({ uploadingCount, totalCount }: FloatingProgressWidgetProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const progressPercent = Math.round(((totalCount - uploadingCount) / totalCount) * 100)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-6 z-50"
        >
          <div className="rounded-2xl bg-card border border-border/50 shadow-xl shadow-black/10 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="flex-shrink-0"
              >
                <Cloud className="w-5 h-5 text-accent" />
              </motion.div>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {uploadingCount}/{totalCount}
                  </p>
                  <p className="text-xs font-semibold text-accent">{progressPercent}%</p>
                </div>
                <div className="w-40 h-1 rounded-full bg-muted/60 overflow-hidden border border-border/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-accent rounded-full shadow-lg shadow-accent/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
