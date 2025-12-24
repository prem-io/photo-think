"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UploadDropzone } from "./upload-dropzone"
import { ImageGrid } from "./image-grid"
import { Header } from "./header"
import { FloatingProgressWidget } from "./floating-progress-widget"
import { useUppy, type FileState } from "@/hooks/use-uppy"

export function ImageUploader() {
  const { files, overallProgress, isUploading, addFiles, uploadAll, cancelAll, retryFile } = useUppy()
  const [hasStartedUpload, setHasStartedUpload] = useState(false)

  // Update hasStartedUpload when files are added
  useEffect(() => {
    if (files.length > 0 && !hasStartedUpload) {
      setHasStartedUpload(true)
    } else if (files.length === 0 && hasStartedUpload) {
      setHasStartedUpload(false)
    }
  }, [files.length, hasStartedUpload])

  const handleDrop = useCallback(
    (fileList: FileList | File[]) => {
      addFiles(fileList)
      if (fileList.length > 0) {
        setHasStartedUpload(true)
      }
    },
    [addFiles]
  )

  const handleRetry = useCallback(
    (id: string) => {
      retryFile(id)
    },
    [retryFile]
  )

  const handleCancel = useCallback(() => {
    cancelAll()
    setHasStartedUpload(false)
  }, [cancelAll])

  // Calculate uploading count from files
  const uploadingCount = files.filter((img) => img.status === "uploading" || img.status === "pending").length
  const totalCount = files.length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Visible in both states */}
      <Header />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasStartedUpload ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-12"
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
                <h1 className="text-4xl sm:text-5xl font-semibold text-foreground mb-3">Good evening</h1>
                <p className="text-lg sm:text-xl text-foreground/70 font-normal mb-2">Can I help you with anything?</p>
                <p className="text-sm text-muted-foreground font-normal">
                  Upload images to get started organizing your collection
                </p>
              </motion.div>

              {/* Hero Dropzone */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-2xl"
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
                  className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
                >
                  {files.length > 0 && <ImageGrid images={files} onRetry={handleRetry} />}
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
                  <UploadDropzone
                    onDrop={handleDrop}
                    isHero={false}
                    uploadingCount={uploadingCount}
                    totalCount={totalCount}
                    onCancel={handleCancel}
                  />
                  {/* Upload button - trigger upload when files are added but not yet uploading */}
                  {files.length > 0 && !isUploading && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={uploadAll}
                      className="mt-4 w-full max-w-2xl mx-auto px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
                    >
                      Upload All ({files.filter((f) => f.status === "pending" || f.status === "error").length})
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
