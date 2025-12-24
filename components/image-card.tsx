"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Check } from "lucide-react"
import type { FileState } from "@/hooks/use-uppy"
import { useImageAspectRatio } from "@/hooks/use-image-aspect-ratio"

interface ImageCardProps {
  image: FileState
  onRetry: () => void
}

export function ImageCard({ image, onRetry }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [calculatedAspectRatio, setCalculatedAspectRatio] = useState<number | null>(null)
  
  // Calculate aspect ratio from image URL if not already set
  useEffect(() => {
    if (image.url && (!image.aspectRatio || image.aspectRatio === 1)) {
      const img = new Image()
      img.onload = () => {
        // Use natural dimensions for accurate aspect ratio
        const aspectRatio = img.naturalHeight / img.naturalWidth
        if (aspectRatio > 0 && isFinite(aspectRatio) && aspectRatio !== 1) {
          setCalculatedAspectRatio(aspectRatio)
        }
      }
      img.onerror = () => {
        setCalculatedAspectRatio(null)
      }
      img.src = image.url
    } else if (image.aspectRatio && image.aspectRatio !== 1) {
      setCalculatedAspectRatio(null) // Use stored aspect ratio
    } else {
      setCalculatedAspectRatio(null)
    }
  }, [image.url, image.aspectRatio])

  // Use calculated aspect ratio if available, otherwise use stored one, fallback to 1
  const displayAspectRatio = calculatedAspectRatio || image.aspectRatio || 1

  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1] as const, // Easing function for smooth motion
      },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl bg-card border border-border/30 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
    >
      {/* Image Container - Pinterest style: width fills column, height based on aspect ratio */}
      <div 
        className="relative w-full bg-muted overflow-hidden" 
        style={{ 
          aspectRatio: displayAspectRatio > 0 && isFinite(displayAspectRatio) 
            ? String(displayAspectRatio) 
            : '1',
        }}
      >
        {/* Skeleton Loader */}
        {image.status === "pending" && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-0 bg-muted-foreground/10"
          />
        )}

        {/* Image - Maintains aspect ratio, fills container width */}
        {image.url && image.url !== "/placeholder.svg" ? (
          <motion.img
            src={image.url}
            alt={image.filename}
            initial={{ opacity: 0 }}
            animate={{
              opacity:
                image.status === "pending" ? 0.6 : image.status === "uploading" ? (image.progress > 30 ? 1 : 0.4) : 1,
            }}
            transition={{ duration: 0.5 }}
            className="w-full h-full transition-all duration-300"
            style={{
              display: 'block',
              objectFit: 'cover',
              objectPosition: 'center',
              width: '100%',
              height: '100%',
              filter: image.status === "error" ? "grayscale(100%)" : "none",
            }}
            loading="lazy"
            onLoad={(e) => {
              // Ensure aspect ratio is correct after image loads
              const img = e.currentTarget
              if (img.naturalWidth && img.naturalHeight && img.naturalWidth > 0) {
                const naturalAspectRatio = img.naturalHeight / img.naturalWidth
                if (naturalAspectRatio > 0 && isFinite(naturalAspectRatio) && naturalAspectRatio !== 1) {
                  // Update calculated aspect ratio if it differs significantly
                  const currentRatio = calculatedAspectRatio || image.aspectRatio || 1
                  if (Math.abs(naturalAspectRatio - currentRatio) > 0.05) {
                    setCalculatedAspectRatio(naturalAspectRatio)
                  }
                }
              }
            }}
          />
        ) : image.status === "pending" ? (
          // Show skeleton for pending files without preview yet
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-0 bg-muted-foreground/10"
          />
        ) : null}

        {/* Progress Bar - Top */}
        {image.status === "uploading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-0 right-0 h-1 bg-muted/40 backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${image.progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent/80 via-accent to-accent/80 shadow-lg shadow-accent/50"
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
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
