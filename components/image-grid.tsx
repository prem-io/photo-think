"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ImageCard } from "./image-card"
import type { FileState } from "@/hooks/use-uppy"

interface ImageGridProps {
  images: FileState[]
  onRetry: (id: string) => void
}

export function ImageGrid({ images, onRetry }: ImageGridProps) {
  const [columnCount, setColumnCount] = useState(4)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Responsive column count with more breakpoints for Pinterest-style
  const updateColumnCount = useCallback(() => {
    if (typeof window === "undefined") return

    const width = window.innerWidth

    // Pinterest-style responsive breakpoints
    if (width < 640) {
      setColumnCount(2) // Mobile: 2 columns
    } else if (width < 768) {
      setColumnCount(2) // Small tablet: 2 columns
    } else if (width < 1024) {
      setColumnCount(3) // Tablet: 3 columns
    } else if (width < 1280) {
      setColumnCount(4) // Desktop: 4 columns
    } else if (width < 1536) {
      setColumnCount(5) // Large desktop: 5 columns
    } else {
      setColumnCount(6) // Extra large: 6 columns
    }
  }, [])

  useEffect(() => {
    updateColumnCount()

    // Debounced resize handler for better performance
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateColumnCount, 150)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [updateColumnCount])

  // Advanced masonry algorithm - distributes images to shortest column
  const columns = useMemo(() => {
    if (!isClient) {
      // Server-side rendering: distribute evenly
      const cols: FileState[][] = Array.from({ length: columnCount }, () => [])
      images.forEach((image, idx) => {
        cols[idx % columnCount].push(image)
      })
      return cols
    }

    const cols: FileState[][] = Array.from({ length: columnCount }, () => [])
    const colHeights: number[] = Array(columnCount).fill(0)

    // Sort images by status to prioritize completed ones
    const sortedImages = [...images].sort((a, b) => {
      const statusOrder = { completed: 0, uploading: 1, pending: 2, error: 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

    // Distribute images to the shortest column for balanced layout
    sortedImages.forEach((image) => {
      // Find the shortest column
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights))

      // Add image to shortest column
      cols[shortestColIndex].push(image)

      // Update column height (use aspect ratio if available, default to 1)
      const aspectRatio = image.aspectRatio || 1
      colHeights[shortestColIndex] += aspectRatio
    })

    return cols
  }, [images, columnCount, isClient])

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  }

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
        staggerChildren: 0.03,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    },
  }

  if (images.length === 0) {
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Pinterest-style masonry grid */}
      <div
        className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
      >
        {columns.map((column, colIdx) => (
          <motion.div
            key={`col-${colIdx}-${columnCount}`}
            variants={columnVariants}
            className="flex flex-col gap-3 sm:gap-4 md:gap-5 lg:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {column.map((image, imageIdx) => (
                <motion.div
                  key={image.id}
                  variants={itemVariants}
                  layout
                  layoutId={image.id}
                  custom={imageIdx}
                  className="w-full"
                >
                  <ImageCard
                    image={image}
                    onRetry={() => onRetry(image.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
