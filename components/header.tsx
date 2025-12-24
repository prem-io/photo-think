"use client"

import { motion } from "framer-motion"

export function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border/20 bg-background/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Left: ThinkAI Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">ThinkAI</h1>
        </div>

        {/* Right: User Avatar */}
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-accent">M</span>
        </div>
      </div>
    </motion.div>
  )
}
