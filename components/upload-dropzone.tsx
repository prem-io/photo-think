"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface UploadDropzoneProps {
  onDrop: (files: FileList | File[]) => void
  isHero?: boolean
  uploadingCount?: number
  totalCount?: number
  overallProgress?: number
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  isPaused?: boolean
  onUpload?: () => void
  hasPendingFiles?: boolean
}

export function UploadDropzone({
  onDrop,
  isHero = false,
  uploadingCount = 0,
  totalCount = 0,
  overallProgress = 0,
  onCancel,
  onPause,
  onResume,
  isPaused = false,
  onUpload,
  hasPendingFiles = false,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  // Setup HTML5 Drag and Drop API with native event listeners
  useEffect(() => {
    const dropzone = dropzoneRef.current
    if (!dropzone) return

    let dragCounter = 0

    // Prevent default drag behaviors on the entire document
    const preventDefaults = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Handle drag enter
    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e)
      dragCounter++

      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragActive(true)
      }
    }

    // Handle drag over - CRITICAL
    const handleDragOver = (e: DragEvent) => {
      preventDefaults(e)

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    // Handle drag leave
    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e)
      dragCounter--

      if (dragCounter === 0) {
        setIsDragActive(false)
      }
    }

    // Handle drop
    const handleDrop = (e: DragEvent) => {
      preventDefaults(e)
      dragCounter = 0
      setIsDragActive(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        // Filter only image files
        const imageFiles = Array.from(files).filter(file =>
          file.type.startsWith('image/')
        )

        if (imageFiles.length === 0) {
          toast.error("No valid images found", {
            description: "Please drop image files only"
          })
          return
        }

        if (imageFiles.length !== files.length) {
          toast.warning(`Filtered ${files.length - imageFiles.length} non-image file${files.length - imageFiles.length > 1 ? 's' : ''}`)
        }

        onDrop(imageFiles)
      }
    }

    // Attach event listeners using native DOM API
    dropzone.addEventListener('dragenter', handleDragEnter as EventListener)
    dropzone.addEventListener('dragover', handleDragOver as EventListener)
    dropzone.addEventListener('dragleave', handleDragLeave as EventListener)
    dropzone.addEventListener('drop', handleDrop as EventListener)

    // Also prevent defaults on document to avoid browser opening files
    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    events.forEach(eventName => {
      document.body.addEventListener(eventName, preventDefaults)
    })

    // Cleanup
    return () => {
      dropzone.removeEventListener('dragenter', handleDragEnter as EventListener)
      dropzone.removeEventListener('dragover', handleDragOver as EventListener)
      dropzone.removeEventListener('dragleave', handleDragLeave as EventListener)
      dropzone.removeEventListener('drop', handleDrop as EventListener)

      events.forEach(eventName => {
        document.body.removeEventListener(eventName, preventDefaults)
      })
    }
  }, [onDrop])

  // Keyboard shortcut: Shift + Enter to upload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter' && hasPendingFiles && onUpload && !uploadingCount) {
        e.preventDefault()
        onUpload()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasPendingFiles, onUpload, uploadingCount])

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        e.preventDefault()
        onDrop(files)
        toast.success(`Pasted ${files.length} image${files.length > 1 ? 's' : ''}`)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [onDrop])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/')
      )

      if (imageFiles.length > 0) {
        onDrop(imageFiles)
      }
    }
    e.target.value = ""
  }

  // Handle click to open file dialog
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('button[aria-label]')) {
      return
    }
    fileInputRef.current?.click()
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
          accept="image/*"
          aria-label="Upload images"
        />

        <motion.div
          ref={dropzoneRef}
          onClick={handleClick}
          animate={{
            borderColor: isDragActive ? "oklch(0.65 0.08 150)" : "oklch(0.93 0.01 160)",
            backgroundColor: isDragActive ? "oklch(0.98 0.01 150)" : "oklch(0.99 0 0)",
            scale: isDragActive ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl border border-border/40 p-16 sm:p-20 cursor-pointer group bg-card shadow-sm hover:shadow-md hover:border-border/60 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-6 text-center pointer-events-none">
            {/* Animated Icon */}
            <motion.div
              animate={isDragActive ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                {isDragActive ? (
                  <ImageIcon className="w-8 h-8 text-accent" strokeWidth={1.5} />
                ) : (
                  <Cloud className="w-8 h-8 text-accent" strokeWidth={1.5} />
                )}
              </div>

              {/* Pulsing ring when dragging */}
              <AnimatePresence>
                {isDragActive && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ scale: 1, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-accent"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Text */}
            <div className="space-y-3">
              <p className="text-lg font-light text-foreground/80">
                {isDragActive ? "Drop your images here" : "Click to upload or drag and drop"}
              </p>
              {!isDragActive && (
                <p className="text-sm text-muted-foreground/70 font-light">
                  Supports JPG, PNG, GIF, WEBP · Max 10MB per file
                </p>
              )}
            </div>
          </div>

          {/* Drop overlay */}
          <AnimatePresence>
            {isDragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-accent/5 rounded-2xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    )
  }

  // Use overall progress from Uppy if available
  const progressPercent = uploadingCount > 0 && overallProgress > 0
    ? overallProgress
    : totalCount > 0
      ? Math.round(((totalCount - uploadingCount) / totalCount) * 100)
      : 0

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*"
        aria-label="Upload images"
      />

      <motion.div
        ref={dropzoneRef}
        onClick={handleClick}
        animate={{
          borderColor: isDragActive ? "oklch(0.65 0.08 150)" : "oklch(0.94 0.01 160)",
          backgroundColor: isDragActive ? "oklch(0.98 0.005 160)" : "oklch(1 0 0)",
          scale: isDragActive ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border border-border/40 p-4 cursor-pointer group bg-card shadow-sm hover:shadow-md hover:border-border/60 transition-all"
      >
        <div className="space-y-3">
          {/* Main Dropzone Row */}
          <div className="flex items-center gap-4">
            {/* Left: Progress Indicator or Upload Icon */}
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
              <motion.div
                animate={isDragActive ? { scale: 1.1, rotate: isDragActive ? [0, -10, 10, 0] : 0 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Upload className={`w-5 h-5 transition-colors ${isDragActive ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'}`} />
              </motion.div>
            )}

            {/* Center: Text */}
            <div className="flex-1 min-w-0 pointer-events-none">
              {uploadingCount > 0 ? (
                <p className="text-sm text-foreground/70 font-light">
                  Uploading your images...
                </p>
              ) : (
                <p className="text-sm text-foreground/70 font-light">
                  {isDragActive ? "Drop to add images" : "Click to upload"}
                </p>
              )}
            </div>

            {/* Right: Upload Controls */}
            {uploadingCount > 0 ? (
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Pause/Resume Button */}
                {isPaused ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onResume?.()
                    }}
                    className="shrink-0 p-1.5 hover:bg-accent/20 rounded-md transition-colors"
                    aria-label="Resume upload"
                  >
                    <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPause?.()
                    }}
                    className="shrink-0 p-1.5 hover:bg-accent/20 rounded-md transition-colors"
                    aria-label="Pause upload"
                  >
                    <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </motion.button>
                )}
                {/* Cancel Button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel?.()
                  }}
                  className="shrink-0 p-1.5 hover:bg-muted rounded-md transition-colors"
                  aria-label="Cancel upload"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </motion.button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap pointer-events-none"></span>
            )}
          </div>

          {/* Info Row */}
          {uploadingCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-muted-foreground/70 px-14 pb-1 pointer-events-none"
            >
              {hasPendingFiles ? (
                <>
                  Press <kbd className="px-1 py-0.5 rounded bg-muted/50 text-xs font-mono">shift + return</kbd> to upload
                </>
              ) : isDragActive ? (
                <span className="text-accent font-normal">Release to add images to queue</span>
              ) : (
                <>
                  Drag and drop, click, or paste{" "}
                  <kbd className="px-1 py-0.5 rounded bg-muted/50 text-[10px] font-mono border border-border/20">
                    Ctrl+V
                  </kbd>{" "}
                  to add images
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-accent/5 rounded-2xl pointer-events-none border-2 border-accent/20"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
