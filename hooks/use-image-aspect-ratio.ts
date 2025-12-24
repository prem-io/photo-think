"use client"

import { useState, useEffect } from "react"

/**
 * Hook to calculate and maintain image aspect ratio
 */
export function useImageAspectRatio(imageUrl: string | undefined, defaultAspectRatio: number = 1) {
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!imageUrl) {
      setAspectRatio(defaultAspectRatio)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const img = new Image()
    
    img.onload = () => {
      const calculatedRatio = img.naturalHeight / img.naturalWidth
      if (calculatedRatio > 0 && isFinite(calculatedRatio)) {
        setAspectRatio(calculatedRatio)
      } else {
        setAspectRatio(defaultAspectRatio)
      }
      setIsLoading(false)
    }

    img.onerror = () => {
      setAspectRatio(defaultAspectRatio)
      setIsLoading(false)
    }

    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl, defaultAspectRatio])

  return { aspectRatio, isLoading }
}

