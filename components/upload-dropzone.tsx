"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, Upload, X, ImageIcon, Paperclip, Globe, Lightbulb, MoreHorizontal, ArrowUp } from "lucide-react"
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
          borderColor: isDragActive ? "oklch(0.65 0.08 150)" : "oklch(0.85 0.01 160)",
          backgroundColor: isDragActive ? "oklch(0.98 0.005 160)" : "oklch(1 0 0)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-xl border border-border/60 bg-background min-h-[60px] p-4 cursor-pointer group"
      >
        {/* Placeholder Text - Top Left */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <p className="text-sm text-muted-foreground/50 font-light">
            {uploadingCount > 0 ? "Uploading..." : isDragActive ? "Drop images here" : "Ask anything"}
          </p>
        </div>

        {/* Bottom Row - Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-3 border-t border-border/40">
          {/* Left Side - Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Paperclip Button - Circular */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="Attach files"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground/70" strokeWidth={1.5} />
            </button>

            {/* Deep Search Button - Pill */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
              aria-label="Deep Search"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground/70 font-light">Deep Search</span>
            </button>

            {/* Reason Button - Pill */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
              aria-label="Reason"
            >
              <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground/70 font-light">Reason</span>
            </button>

            {/* More Options Button - Circular */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground/70" strokeWidth={1.5} />
            </button>
          </div>

          {/* Right Side - Send/Upload Button */}
          <div className="flex items-center gap-2">
            {uploadingCount > 0 && (
              <span className="text-xs text-muted-foreground/70 mr-2">
                {uploadingCount}/{totalCount}
              </span>
            )}
            {hasPendingFiles && !isUploading && !isPaused ? (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onUpload?.()
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shadow-sm hover:shadow transition-all"
                aria-label="Upload images"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </motion.button>
            ) : uploadingCount > 0 ? (
              <div className="flex items-center gap-1">
                {isPaused ? (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      onResume?.()
                    }}
                    className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                    aria-label="Resume"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPause?.()
                    }}
                    className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                    aria-label="Pause"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </motion.button>
                )}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel?.()
                  }}
                  className="w-9 h-9 rounded-lg border border-border/50 hover:bg-muted flex items-center justify-center transition-all"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-accent/5 rounded-xl pointer-events-none border-2 border-accent/20"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
