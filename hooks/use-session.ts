"use client"

import { useState, useEffect, useCallback } from "react"
import type { FileState } from "./use-uppy"

const SESSION_KEY = "image_uploader_session"
const IMAGES_KEY = "image_uploader_images"

export interface UserSession {
  userId: string
  createdAt: number
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [images, setImages] = useState<FileState[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load session and images from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    // Small delay to ensure smooth loading experience
    const loadData = () => {
      try {
        // Load session
        const sessionData = localStorage.getItem(SESSION_KEY)
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData) as UserSession
            setSession(parsed)
          } catch (error) {
            console.error("Failed to parse session data:", error)
          }
        }

        // Load images
        const imagesData = localStorage.getItem(IMAGES_KEY)
        if (imagesData) {
          try {
            const parsed = JSON.parse(imagesData) as FileState[]
            // Filter only completed images and ensure aspect ratios are set
            const completedImages = parsed
              .filter((img) => img.status === "completed" && img.cloudinaryUrl)
              .map((img) => {
                // Ensure aspect ratio is set, default to 1 if missing
                if (!img.aspectRatio || img.aspectRatio <= 0) {
                  img.aspectRatio = 1
                }
                return img
              })
            setImages(completedImages)
          } catch (error) {
            console.error("Failed to parse images data:", error)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      loadData()
    })
  }, [])

  // Create session (called on first upload)
  const createSession = useCallback(() => {
    if (typeof window === "undefined") return null

    const newSession: UserSession = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    setSession(newSession)
    return newSession
  }, [])

  // Logout - clear session and images, then navigate
  const logout = useCallback(() => {
    if (typeof window === "undefined") return

    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(IMAGES_KEY)
    setSession(null)
    setImages([])
    
    // Programmatically navigate/refresh to reset the app state
    window.location.href = "/"
  }, [])

  // Save image to localStorage
  const saveImage = useCallback((image: FileState) => {
    if (typeof window === "undefined") return

    // Ensure session exists
    if (!session) {
      createSession()
    }

    // Get existing images
    const existingImages = [...images]
    
    // Check if image already exists (by id)
    const existingIndex = existingImages.findIndex((img) => img.id === image.id)
    
    if (existingIndex >= 0) {
      // Update existing image
      existingImages[existingIndex] = image
    } else {
      // Add new image
      existingImages.push(image)
    }

    // Filter only completed images for storage
    const completedImages = existingImages.filter((img) => img.status === "completed" && img.cloudinaryUrl)
    
    // Save to localStorage
    localStorage.setItem(IMAGES_KEY, JSON.stringify(completedImages))
    setImages(completedImages)
  }, [session, images, createSession])

  // Save multiple images
  const saveImages = useCallback((newImages: FileState[]) => {
    if (typeof window === "undefined") return

    // Ensure session exists
    if (!session) {
      createSession()
    }

    // Merge with existing images
    const existingImages = [...images]
    const imageMap = new Map(existingImages.map((img) => [img.id, img]))

    // Update or add new images
    newImages.forEach((image) => {
      imageMap.set(image.id, image)
    })

    // Convert back to array and filter only completed
    const allImages = Array.from(imageMap.values())
    const completedImages = allImages.filter((img) => img.status === "completed" && img.cloudinaryUrl)

    // Save to localStorage
    localStorage.setItem(IMAGES_KEY, JSON.stringify(completedImages))
    setImages(completedImages)
  }, [session, images, createSession])

  // Remove image from localStorage
  const removeImage = useCallback((imageId: string) => {
    if (typeof window === "undefined") return

    const updatedImages = images.filter((img) => img.id !== imageId)
    localStorage.setItem(IMAGES_KEY, JSON.stringify(updatedImages))
    setImages(updatedImages)
  }, [images])

  return {
    session,
    images,
    isLoading,
    createSession,
    logout,
    saveImage,
    saveImages,
    removeImage,
    isAuthenticated: !!session,
  }
}

