"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UploadDropzone } from "./upload-dropzone"
import { ImageGrid } from "./image-grid"
import { Header } from "./header"
import { FloatingProgressWidget } from "./floating-progress-widget"
import { QueueStats } from "./queue-stats"
import { useUppy, type FileState } from "@/hooks/use-uppy"
import { useSession } from "@/hooks/use-session"

export function ImageUploader() {
  const { files, overallProgress, isUploading, addFiles, uploadAll, cancelAll, pauseAll, resumeAll, retryFile } = useUppy()
  const { session, images: savedImages, isLoading: isLoadingSession, createSession, saveImage, saveImages, logout } = useSession()
  const [hasStartedUpload, setHasStartedUpload] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const prevFilesRef = useRef<string>("")
  const prevSavedImagesRef = useRef<string>("")
  const allFilesCacheRef = useRef<FileState[]>([])

  // Merge Uppy files with saved images from localStorage using useMemo to prevent infinite loops
  const allFiles = useMemo((): FileState[] => {
    const filesKey = JSON.stringify(files.map((f) => ({ id: f.id, status: f.status })))
    const savedImagesKey = JSON.stringify(savedImages.map((f) => ({ id: f.id })))
    
    // Only recalculate if files or savedImages actually changed
    if (filesKey === prevFilesRef.current && savedImagesKey === prevSavedImagesRef.current) {
      // Return cached result to prevent unnecessary recalculations
      return allFilesCacheRef.current
    }
    
    prevFilesRef.current = filesKey
    prevSavedImagesRef.current = savedImagesKey
    
    const uppyFileIds = new Set(files.map((f) => f.id))
    const savedImagesNotInUppy = savedImages.filter((img) => !uppyFileIds.has(img.id))
    const merged = [...files, ...savedImagesNotInUppy]
    allFilesCacheRef.current = merged
    return merged
  }, [files, savedImages])

  // Load saved images on mount and show them
  useEffect(() => {
    if (savedImages.length > 0 && !hasStartedUpload) {
      setHasStartedUpload(true)
    }
  }, [savedImages.length, hasStartedUpload])

  // Save completed images to localStorage - use ref to track what we've already saved
  const savedFileIdsRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    const completedFiles = files.filter(
      (f) => f.status === "completed" && f.cloudinaryUrl && !savedFileIdsRef.current.has(f.id)
    )
    
    if (completedFiles.length > 0) {
      // Create session if it doesn't exist (first upload)
      if (!session) {
        createSession()
      }
      // Save completed images
      saveImages(completedFiles)
      // Track which files we've saved
      completedFiles.forEach((f) => savedFileIdsRef.current.add(f.id))
    }
  }, [files, session, createSession, saveImages])

  // Handle logout - clear everything
  useEffect(() => {
    if (!session && hasStartedUpload) {
      // Session was cleared, reset UI
      setHasStartedUpload(false)
      savedFileIdsRef.current.clear()
      prevFilesRef.current = ""
      prevSavedImagesRef.current = ""
      allFilesCacheRef.current = []
    }
  }, [session, hasStartedUpload])


  const handleDrop = useCallback(
    (fileList: FileList | File[]) => {
      // Create session on first upload if it doesn't exist
      if (!session) {
        createSession()
      }
      addFiles(fileList)
      if (fileList.length > 0) {
        setHasStartedUpload(true)
      }
    },
    [addFiles, session, createSession]
  )

  const handleRetry = useCallback(
    (id: string) => {
      // Only retry files that are in Uppy (not saved images)
      const fileInUppy = files.find((f) => f.id === id)
      if (fileInUppy) {
        retryFile(id)
      }
    },
    [retryFile, files]
  )

  const handleCancel = useCallback(() => {
    cancelAll()
    setHasStartedUpload(false)
    setIsPaused(false)
  }, [cancelAll])

  const handlePause = useCallback(() => {
    pauseAll()
    setIsPaused(true)
  }, [pauseAll])

  const handleResume = useCallback(() => {
    resumeAll()
    setIsPaused(false)
  }, [resumeAll])

  // Calculate counts from allFiles (what's actually displayed) for consistency
  const uploadingCount = allFiles.filter((img) => img.status === "uploading").length
  const pendingCount = allFiles.filter((img) => img.status === "pending").length
  const completedCount = allFiles.filter((img) => img.status === "completed").length
  const errorCount = allFiles.filter((img) => img.status === "error").length
  const totalCount = allFiles.length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Visible in both states */}
      <Header />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoadingSession ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-12"
            >
              {/* Loading Spinner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <div className="relative w-16 h-16">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-accent/20"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>

              {/* Loading Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-center"
              >
                <p className="text-sm text-muted-foreground font-normal">
                  Loading your images...
                </p>
              </motion.div>
            </motion.div>
          ) : !hasStartedUpload ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-linear-to-b from-background via-background to-muted/5"
            >
              {/* Green Gradient Orb - AI Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="relative w-24 h-24">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.75 0.12 150) 0%, oklch(0.85 0.06 160) 50%, oklch(0.92 0.02 180) 100%)",
                    }}
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.75 0.12 150) 0%, oklch(0.85 0.06 160) 100%)",
                    }}
                  />
                </div>
              </motion.div>

              {/* Greeting Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center mb-12 max-w-2xl"
              >
                <h1 className="text-4xl sm:text-5xl font-normal text-foreground mb-4 tracking-tight">Upload your images</h1>
                <p className="text-base text-muted-foreground/70 font-light leading-relaxed">
                  Choose files below or drag and drop to start uploading with PhotoThink
                </p>
              </motion.div>

              {/* Hero Dropzone */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-3xl"
              >
                <UploadDropzone onDrop={handleDrop} isHero={true} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="active-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Image Grid - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6"
                >
                  {/* Queue Stats */}
                  <QueueStats
                    totalFiles={totalCount}
                    uploadingCount={uploadingCount}
                    completedCount={completedCount}
                    errorCount={errorCount}
                    pendingCount={pendingCount}
                  />

                  {/* Image Grid */}
                  {allFiles.length > 0 && <ImageGrid images={allFiles} onRetry={handleRetry} />}
                </motion.div>
              </div>

              {/* Floating Progress Widget */}
              {isUploading && overallProgress.totalFiles > 0 && (
                <FloatingProgressWidget
                  uploadingCount={overallProgress.totalFiles - overallProgress.completedFiles}
                  totalCount={overallProgress.totalFiles}
                />
              )}

              {/* Bottom Dropzone with Progress */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="border-t border-border/30 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-6"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                  <UploadDropzone
                    onDrop={handleDrop}
                    isHero={false}
                    uploadingCount={uploadingCount}
                    totalCount={totalCount}
                    overallProgress={overallProgress.percentage}
                    onCancel={handleCancel}
                    onPause={handlePause}
                    onResume={handleResume}
                    isPaused={isPaused}
                    onUpload={uploadAll}
                    hasPendingFiles={pendingCount > 0}
                  />
                    </div>
                    {/* Upload button with badge */}
                    {pendingCount > 0 && !isUploading && !isPaused && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={uploadAll}
                        className="relative shrink-0 w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-accent/90"
                        aria-label={`Upload ${pendingCount} images`}
                      >
                        {/* Badge */}
                        {pendingCount > 1 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                          >
                            {pendingCount > 99 ? "99+" : pendingCount}
                          </motion.div>
                        )}
                        <motion.svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ x: -2 }}
                          animate={{ x: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </motion.svg>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
