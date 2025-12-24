"use client"

import { motion } from "framer-motion"
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface QueueStatsProps {
  totalFiles: number
  uploadingCount: number
  completedCount: number
  errorCount: number
  pendingCount: number
}

export function QueueStats({
  totalFiles,
  uploadingCount,
  completedCount,
  errorCount,
  pendingCount,
}: QueueStatsProps) {
  if (totalFiles === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-lg border border-border/40"
    >
      {/* Total Files */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-accent">{totalFiles}</span>
        </div>
        <span className="text-xs text-muted-foreground">Total</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border/50" />

      {/* Uploading */}
      {uploadingCount > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <span className="text-sm font-medium text-foreground">{uploadingCount}</span>
            <span className="text-xs text-muted-foreground">Uploading</span>
          </div>
          <div className="w-px h-6 bg-border/50" />
        </>
      )}

      {/* Pending */}
      {pendingCount > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{pendingCount}</span>
            <span className="text-xs text-muted-foreground">Queued</span>
          </div>
          <div className="w-px h-6 bg-border/50" />
        </>
      )}

      {/* Completed */}
      {completedCount > 0 && (
        <>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">{completedCount}</span>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
        </>
      )}

      {/* Errors */}
      {errorCount > 0 && (
        <>
          <div className="w-px h-6 bg-border/50" />
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{errorCount}</span>
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
        </>
      )}
    </motion.div>
  )
}
