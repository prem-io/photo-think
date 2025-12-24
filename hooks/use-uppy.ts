"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Uppy from "@uppy/core"
import XHRUpload from "@uppy/xhr-upload"
import ThumbnailGenerator from "@uppy/thumbnail-generator"
import type { UppyFile, Meta, Body } from "@uppy/core"
import { toast } from "sonner"

// Cloudinary configuration - should be moved to env vars in production
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name"
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

export interface FileState {
  id: string
  url: string
  thumbnail?: string
  filename: string
  aspectRatio: number
  status: "pending" | "uploading" | "completed" | "error"
  progress: number
  bytesUploaded: number
  bytesTotal: number
  cloudinaryUrl?: string
  error?: string
}

interface UploadProgress {
  totalFiles: number
  completedFiles: number
  totalBytes: number
  bytesUploaded: number
  percentage: number
}

export function useUppy() {
  const uppyRef = useRef<Uppy<Meta, Record<string, never>> | null>(null)
  const [files, setFiles] = useState<FileState[]>([])
  const [overallProgress, setOverallProgress] = useState<UploadProgress>({
    totalFiles: 0,
    completedFiles: 0,
    totalBytes: 0,
    bytesUploaded: 0,
    percentage: 0,
  })
  const [isUploading, setIsUploading] = useState(false)

  // Helper to update file state
  const updateFileState = useCallback((fileId: string, updater: (prev: FileState) => FileState) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === fileId)
      if (index === -1) {
        // File not in state yet, create initial state
        const uppyFile = uppyRef.current?.getFile(fileId)
        if (!uppyFile) return prev

        const newState: FileState = {
          id: fileId,
          url: uppyFile.preview || "/placeholder.svg",
          filename: uppyFile.name || "untitled",
          aspectRatio: 1,
          status: "pending",
          progress: 0,
          bytesUploaded: 0,
          bytesTotal: uppyFile.size || 0,
        }
        return [...prev, updater(newState)]
      }
      return prev.map((f) => (f.id === fileId ? updater(f) : f))
    })
  }, [])

  // Initialize Uppy instance
  useEffect(() => {
    // Sync files state with Uppy - defined inside useEffect to avoid dependency issues
    const syncFiles = () => {
      if (!uppyRef.current) return

      const uppyFiles = uppyRef.current.getFiles()
      setFiles((prevFiles) => {
        const fileStates: FileState[] = uppyFiles.map((file) => {
          const existing = prevFiles.find((f) => f.id === file.id)

          // Determine status
          let status: FileState["status"] = "pending"
          if (file.progress?.uploadComplete) {
            status = "completed"
          } else if (file.error) {
            status = "error"
          } else if (file.progress?.percentage !== undefined && file.progress.percentage > 0) {
            status = "uploading"
          }

          // Get Cloudinary URL from response
          const response = file.response as { url?: string; body?: { url?: string } } | undefined
          const cloudinaryUrl = response?.url || response?.body?.url

          return {
            id: file.id,
            url: existing?.url || file.preview || cloudinaryUrl || "/placeholder.svg",
            thumbnail: existing?.thumbnail || file.preview,
            filename: file.name || "untitled",
            aspectRatio: existing?.aspectRatio || 1,
            status,
            progress: file.progress?.percentage || 0,
            bytesUploaded: file.progress?.bytesUploaded || 0,
            bytesTotal: file.size || 0,
            cloudinaryUrl: cloudinaryUrl || existing?.cloudinaryUrl,
            error: file.error ? String(file.error) : undefined,
          }
        })

        return fileStates
      })
    }
    const uppy = new Uppy<Meta, Record<string, never>>({
      autoProceed: false,
      allowMultipleUploads: true,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB - VERY IMPORTANT
        allowedFileTypes: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        maxNumberOfFiles: 1000, // Support up to 1000 files in queue
      },
      // Bounded concurrency: only 3 files upload simultaneously
      // This prevents network saturation and browser throttling
      infoTimeout: 5000,
    })

    // Configure XHRUpload for Cloudinary
    uppy.use(XHRUpload, {
      endpoint: CLOUDINARY_UPLOAD_URL,
      formData: true,
      fieldName: "file",
      bundle: false,
      limit: 3, // Maximum 3 concurrent uploads - bounded concurrency
      timeout: 60000, // 60 second timeout per upload
      // Add upload preset to form data via allowedMetaFields
      allowedMetaFields: ["upload_preset"],
      getResponseData(xhr: XMLHttpRequest): Body {
        try {
          const data = JSON.parse(xhr.responseText)
          return {
            url: data.secure_url,
            public_id: data.public_id,
          }
        } catch (error) {
          return { url: null, public_id: null }
        }
      },
      getResponseError(xhr: XMLHttpRequest): Error {
        try {
          const data = JSON.parse(xhr.responseText)
          return new Error(data.error?.message || "Upload failed")
        } catch {
          return new Error("Upload failed")
        }
      },
    } as any)

    // Configure ThumbnailGenerator
    uppy.use(ThumbnailGenerator, {
      thumbnailWidth: 400,
      thumbnailHeight: 400,
    })

    // Event: File added - sync immediately to show in grid
    uppy.on("file-added", (file: UppyFile<Meta, Record<string, never>>) => {
      // Sync immediately so pending files appear in grid
      syncFiles()
      
      // Also create a preview URL from the file data if available
      if (file.data instanceof File) {
        const previewUrl = URL.createObjectURL(file.data)
        updateFileState(file.id, (prev) => ({
          ...prev,
          url: previewUrl,
          thumbnail: previewUrl,
        }))
      }
    })

    // Event: Thumbnail generated
    uppy.on("thumbnail:generated", (file: UppyFile<Meta, Record<string, never>>, preview: string) => {
      updateFileState(file.id, (prev) => {
        // Clean up object URL if we created one earlier
        if (prev.url && prev.url.startsWith('blob:')) {
          URL.revokeObjectURL(prev.url)
        }
        return {
          ...prev,
          thumbnail: preview,
          url: preview, // Use thumbnail as URL until upload completes
        }
      })
    })

    // Event: Upload progress
    uppy.on("upload-progress", (file: UppyFile<Meta, Record<string, never>> | undefined, progress) => {
      if (!file) return

      updateFileState(file.id, (prev) => ({
        ...prev,
        status: "uploading",
        progress: progress.percentage || 0,
        bytesUploaded: progress.bytesUploaded || 0,
        bytesTotal: progress.bytesTotal || prev.bytesTotal,
      }))
    })

    // Event: Upload success
    uppy.on("upload-success", (file: UppyFile<Meta, Record<string, never>> | undefined, response) => {
      if (!file) return
      // Cloudinary response structure: getResponseData returns { url: data.secure_url, public_id: ... }
      // So file.response.url contains the secure_url from Cloudinary
      const responseData = file.response as { url?: string; public_id?: string } | undefined
      const cloudinaryUrl = responseData?.url

      updateFileState(file.id, (prev) => ({
        ...prev,
        status: "completed",
        progress: 100,
        cloudinaryUrl,
        url: cloudinaryUrl || prev.url, // Use Cloudinary URL if available
      }))
    })

    // Event: Upload error
    uppy.on("upload-error", (file: UppyFile<Meta, Record<string, never>> | undefined, error) => {
      if (!file) return
      updateFileState(file.id, (prev) => ({
        ...prev,
        status: "error",
        error: error?.message || "Upload failed",
      }))
      // Show error toast
      toast.error(`Failed to upload ${file.name}`, {
        description: error?.message || "Please try again",
      })
    })

    // Event: Overall progress
    uppy.on("progress", (progress: number) => {
      const allFiles = uppy.getFiles()
      const totalBytes = allFiles.reduce((sum, f) => sum + (f.size || 0), 0)
      const bytesUploaded = allFiles.reduce((sum, f) => sum + (f.progress?.bytesUploaded || 0), 0)
      const completedFiles = allFiles.filter((f) => f.progress?.uploadComplete).length

      setOverallProgress({
        totalFiles: allFiles.length,
        completedFiles,
        totalBytes,
        bytesUploaded,
        percentage: Math.round(progress * 100),
      })
    })

    // Event: Upload started
    uppy.on("upload", () => {
      setIsUploading(true)
    })

    // Event: Upload complete
    uppy.on("complete", (result) => {
      setIsUploading(false)
      syncFiles()

      // Show success toast if any files were uploaded successfully
      if (result && result.successful && result.successful.length > 0) {
        toast.success(`Successfully uploaded ${result.successful.length} image${result.successful.length > 1 ? 's' : ''}`)
      }
    })

    // Event: Upload cancelled
    uppy.on("cancel-all", () => {
      setIsUploading(false)
      syncFiles()
    })

    // Event: File removed
    uppy.on("file-removed", (file: UppyFile<Meta, Record<string, never>>) => {
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    })

    // Subscribe to state changes
    uppy.on("state-update", syncFiles)

    // Initial sync
    syncFiles()

    uppyRef.current = uppy

    // Cleanup
    return () => {
      // Remove event listeners (Uppy doesn't have a global off, so we rely on component unmount)
      // The Uppy instance will be garbage collected when the ref is cleared
      uppyRef.current = null
    }
  }, [updateFileState])

  // Add files from FileList or File[]
  const addFiles = useCallback((fileList: FileList | File[]) => {
    if (!uppyRef.current) return

    const filesArray = Array.from(fileList)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    let invalidTypeCount = 0
    let oversizedCount = 0

    const validFiles = filesArray.filter((file) => {
      // Validate file type - must be one of the allowed formats
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      const isValidType = allowedTypes.includes(file.type.toLowerCase()) || allowedExtensions.includes(fileExtension)

      if (!isValidType) {
        invalidTypeCount++
        return false
      }

      // Validate file size - max 10MB (VERY IMPORTANT)
      if (file.size > 10 * 1024 * 1024) {
        oversizedCount++
        return false
      }

      return true
    })

    // Show validation error toasts
    if (invalidTypeCount > 0) {
      toast.error(`${invalidTypeCount} file${invalidTypeCount > 1 ? 's' : ''} rejected`, {
        description: "Only JPG, PNG, GIF, and WEBP images are allowed",
      })
    }

    if (oversizedCount > 0) {
      toast.error(`${oversizedCount} file${oversizedCount > 1 ? 's' : ''} too large`, {
        description: "Maximum file size is 10MB per image",
      })
    }

    if (validFiles.length > 0) {
      uppyRef.current.addFiles(
        validFiles.map((file) => ({
          source: "Local",
          name: file.name,
          type: file.type,
          data: file,
          meta: {
            upload_preset: CLOUDINARY_UPLOAD_PRESET,
          },
        }))
      )
      // No toast needed - images are visible in the queue
    }
  }, [])

  // Upload all files
  const uploadAll = useCallback(() => {
    if (!uppyRef.current) return
    uppyRef.current.upload()
  }, [])

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    if (!uppyRef.current) return
    uppyRef.current.cancelAll()
  }, [])

  // Retry failed files
  const retryFailed = useCallback(() => {
    if (!uppyRef.current) return
    const failedFiles = uppyRef.current.getFiles().filter((f) => f.error)
    failedFiles.forEach((file) => {
      uppyRef.current?.retryUpload(file.id)
    })
  }, [])

  // Retry single file
  const retryFile = useCallback((fileId: string) => {
    if (!uppyRef.current) return
    uppyRef.current.retryUpload(fileId)
  }, [])

  // Clear completed files
  const clearCompleted = useCallback(() => {
    if (!uppyRef.current) return
    const completedFiles = uppyRef.current.getFiles().filter((f) => f.progress?.uploadComplete)
    completedFiles.forEach((file) => {
      uppyRef.current?.removeFile(file.id)
    })
  }, [])

  // Pause all uploads
  const pauseAll = useCallback(() => {
    if (!uppyRef.current) return
    uppyRef.current.pauseAll()
  }, [])

  // Resume all uploads
  const resumeAll = useCallback(() => {
    if (!uppyRef.current) return
    uppyRef.current.resumeAll()
  }, [])

  // Calculate aspect ratio from image - use natural dimensions for accurate ratio
  const calculateAspectRatio = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        // Use natural dimensions to get true aspect ratio
        const aspectRatio = img.naturalHeight / img.naturalWidth
        URL.revokeObjectURL(url)
        if (aspectRatio > 0 && isFinite(aspectRatio)) {
          resolve(aspectRatio)
        } else {
          resolve(1) // Fallback to square
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(1) // Default aspect ratio
      }
      img.src = url
    })
  }, [])

  // Update aspect ratios when files are added
  useEffect(() => {
    const updateAspectRatios = async () => {
      if (!uppyRef.current) return

      const uppyFiles = uppyRef.current.getFiles()
      for (const uppyFile of uppyFiles) {
        const existing = files.find((f) => f.id === uppyFile.id)
        if (!existing || existing.aspectRatio === 1) {
          // Try to get aspect ratio from thumbnail or calculate
          if (uppyFile.data instanceof File) {
            const aspectRatio = await calculateAspectRatio(uppyFile.data)
            updateFileState(uppyFile.id, (prev) => ({ ...prev, aspectRatio }))
          }
        }
      }
    }

    updateAspectRatios()
  }, [files.length, calculateAspectRatio, updateFileState])

  return {
    files,
    overallProgress,
    isUploading,
    addFiles,
    uploadAll,
    cancelAll,
    pauseAll,
    resumeAll,
    retryFailed,
    retryFile,
    clearCompleted,
  }
}
