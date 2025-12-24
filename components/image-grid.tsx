"use client"

import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ImageCard } from "./image-card"
import type { FileState } from "@/hooks/use-uppy"

interface ImageGridProps {
  images: FileState[]
  onRetry: (id: string) => void
}

export function ImageGrid({ images, onRetry }: ImageGridProps) {
  const [columnCount, setColumnCount] = useState(4)

  useEffect(() => {
    const updateColumnCount = () => {
      if (typeof window === "undefined") return
      const width = window.innerWidth
      setColumnCount(width < 768 ? 2 : width < 1024 ? 3 : 4)
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  // Compute masonry layout with balanced heights
  const columns = useMemo(() => {
    const cols: FileState[][] = Array.from({ length: columnCount }, () => [])

    // Distribute images to balance column heights
    images.forEach((image) => {
      const shortestCol = cols.reduce((min, col, idx) => {
        const minHeight = cols[min].reduce((sum, img) => sum + img.aspectRatio, 0)
        const colHeight = col.reduce((sum, img) => sum + img.aspectRatio, 0)
        return colHeight < minHeight ? idx : min
      }, 0)
      cols[shortestCol].push(image)
    })

    return cols
  }, [images, columnCount])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const columnVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6"
    >
      {columns.map((column, colIdx) => (
        <motion.div key={colIdx} variants={columnVariants} className="flex flex-col gap-4 md:gap-5 lg:gap-6">
          {column.map((image) => (
            <ImageCard key={image.id} image={image} onRetry={() => onRetry(image.id)} />
          ))}
        </motion.div>
      ))}
    </motion.div>
  )
}
