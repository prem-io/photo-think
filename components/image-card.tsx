"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Check } from "lucide-react"
import type { FileState } from "@/hooks/use-uppy"

interface ImageCardProps {
  image: FileState
  onRetry: () => void
}

export function ImageCard({ image, onRetry }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl bg-card border border-border/30 hover:border-accent/50 transition-colors duration-300"
    >
      {/* Image Container */}
      <div className="relative w-full bg-muted overflow-hidden" style={{ aspectRatio: image.aspectRatio }}>
        {/* Skeleton Loader */}
        {image.status === "pending" && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-0 bg-muted-foreground/10"
          />
        )}

        {/* Image */}
        {image.url && (
          <motion.img
            src={image.url}
            alt={image.filename}
            initial={{ opacity: 0 }}
            animate={{
              opacity:
                image.status === "pending" ? 0.6 : image.status === "uploading" ? (image.progress > 30 ? 1 : 0.4) : 1,
            }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full object-cover transition-all duration-300 ${
              image.status === "error" ? "grayscale" : ""
            }`}
            loading="lazy"
          />
        )}

        {/* Progress Bar - Top */}
        {image.status === "uploading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-0 right-0 h-1 bg-muted/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${image.progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-accent shadow-lg shadow-accent/50"
            />
          </motion.div>
        )}

        {/* Status Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || image.status !== "completed" ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/20 flex items-center justify-center"
        >
          {image.status === "pending" && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="px-3 py-1 rounded-full bg-muted-foreground/20 backdrop-blur-sm border border-muted-foreground/30"
            >
              <p className="text-xs font-medium text-muted-foreground">Queued</p>
            </motion.div>
          )}

          {image.status === "error" && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 backdrop-blur-sm hover:bg-destructive/20 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">Retry</span>
            </motion.button>
          )}

          {image.status === "completed" && isHovered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-8 h-8 bg-accent rounded-full flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-accent-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </motion.div>

        {/* Filename Overlay - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 8,
          }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 py-4 backdrop-blur-sm"
        >
          <p className="text-xs font-medium text-white truncate">{image.filename}</p>
        </motion.div>

        {/* Success Glow */}
        {image.status === "completed" && !isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0] }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 bg-accent/20"
          />
        )}
      </div>
    </motion.div>
  )
}
