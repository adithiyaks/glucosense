"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  disableFloat?: boolean;
}

export function GlassCard({ children, className, disableFloat = false, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-3xl overflow-hidden",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        "transition-colors duration-500 hover:bg-white/10",
        className
      )}
      animate={
        disableFloat
          ? {}
          : {
              y: [0, -3, 0],
            }
      }
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileHover={{ scale: 1.01 }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full h-full p-6">{children}</div>
    </motion.div>
  );
}
