"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface UploadProgressSectionProps {
  uploadingCount: number
  totalCount: number
  onVisibilityChange?: (visible: boolean) => void
}

export function UploadProgressSection({ uploadingCount, totalCount, onVisibilityChange }: UploadProgressSectionProps) {
  const [isInViewport, setIsInViewport] = useState(true)
  const progressPercent = Math.round(((totalCount - uploadingCount) / totalCount) * 100)
  const completedCount = totalCount - uploadingCount

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
        onVisibilityChange?.(entry.isIntersecting)
      },
      { threshold: 0.5 },
    )

    const element = document.getElementById("progress-section")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [onVisibilityChange])

  if (uploadingCount === 0) return null

  return (
    <motion.div
      id="progress-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <motion.h3 className="text-sm font-semibold text-gray-800">Upload Progress</motion.h3>
            <motion.span
              animate={{ opacity: [0.6, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="w-2 h-2 rounded-full bg-blue-500"
            />
          </div>
          <motion.p className="text-xs text-gray-600">
            {uploadingCount > 0 ? `${completedCount} of ${totalCount} completed` : `${totalCount} files uploaded`}
          </motion.p>
        </div>

        <motion.div key={progressPercent} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {progressPercent}
            <span className="text-sm text-gray-600 ml-1">%</span>
          </div>
        </motion.div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-blue-500 shadow-sm"
        />
      </div>
    </motion.div>
  )
}
