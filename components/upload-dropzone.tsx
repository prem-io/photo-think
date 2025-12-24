"use client"

import type React from "react"
import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Cloud, Upload, X } from "lucide-react"

interface UploadDropzoneProps {
  onDrop: (files: FileList | File[]) => void
  isHero?: boolean
  uploadingCount?: number
  totalCount?: number
  onCancel?: () => void
}

export function UploadDropzone({
  onDrop,
  isHero = false,
  uploadingCount = 0,
  totalCount = 0,
  onCancel,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onDrop(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onDrop(files)
    }
    // Reset input to allow selecting the same file again
    e.target.value = ""
  }

  if (isHero) {
    return (
      <div className="w-full">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
          capture="environment"
        />

        <motion.div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          animate={{
            borderColor: isDragActive ? "oklch(0.65 0.08 150)" : "oklch(0.92 0.01 160)",
            backgroundColor: isDragActive ? "oklch(0.98 0.005 160)" : "oklch(0.99 0.002 180)",
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl border-2 border-dashed p-12 sm:p-16 cursor-pointer group"
        >
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Animated Cloud Icon */}
            <motion.div
              animate={isDragActive ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Cloud className="w-8 h-8 text-accent" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Text */}
            <div>
              <p className="text-lg font-light text-foreground/70 mb-2">Drop images here</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-accent hover:text-accent/80 underline font-medium transition-colors"
              >
                or click to browse
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const progressPercent = totalCount > 0 ? Math.round(((totalCount - uploadingCount) / totalCount) * 100) : 0

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        capture="environment"
      />

      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragActive ? "oklch(0.65 0.08 150)" : "oklch(0.94 0.01 160)",
          backgroundColor: isDragActive ? "oklch(0.98 0.005 160)" : "oklch(1 0 0)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border p-4 cursor-pointer group bg-card/90 backdrop-blur-sm hover:bg-card transition-colors"
      >
        <div className="space-y-3">
          {/* Main Dropzone Row */}
          <div className="flex items-center gap-4">
            {/* Left: Progress Indicator */}
            {uploadingCount > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 flex items-center gap-2"
              >
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="oklch(0.92 0.01 160)" strokeWidth="2" />
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="oklch(0.65 0.08 150)"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={`${2 * Math.PI * 14 * (1 - progressPercent / 100)}`}
                      strokeLinecap="round"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      animate={{ strokeDashoffset: `${2 * Math.PI * 14 * (1 - progressPercent / 100)}` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-foreground">{progressPercent}</span>
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {uploadingCount}/{totalCount}
                </span>
              </motion.div>
            ) : (
              <motion.div animate={isDragActive ? { scale: 1.05 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </motion.div>
            )}

            {/* Center: Text */}
            <div className="flex-1 min-w-0">
              {uploadingCount > 0 ? (
                <p className="text-sm text-foreground/70 font-light">Uploading your images...</p>
              ) : (
                <p className="text-sm text-foreground/70 font-light">
                  Drop images or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-accent hover:text-accent/80 underline font-medium transition-colors"
                  >
                    click to browse
                  </button>
                </p>
              )}
            </div>

            {/* Right: Cancel Button or Model Label */}
            {uploadingCount > 0 ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={onCancel}
                className="shrink-0 p-1.5 hover:bg-muted rounded-md transition-colors"
                aria-label="Cancel upload"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </motion.button>
            ) : (
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">ThinkAI 3.5 Smart</span>
            )}
          </div>

          {/* Model Info Row - Shown when not uploading */}
          {uploadingCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-muted-foreground/70 px-14 pb-1"
            >
              Use <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-xs font-mono">shift + return</kbd> for new line
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
