"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Droplet } from "lucide-react";
import { motion } from "framer-motion";

interface SpO2CardProps {
  spo2: number;
}

export function SpO2Card({ spo2 }: SpO2CardProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (spo2 / 100) * circumference;

  return (
    <GlassCard className="flex flex-col h-48 justify-between relative group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
            SpO₂ Level
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-50 font-mono tracking-tight">
              {spo2}
            </span>
            <span className="text-sm font-medium text-slate-400">%</span>
          </div>
        </div>
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Droplet className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
        </div>
      </div>

      <div className="absolute right-4 bottom-4 flex items-center justify-center">
        <svg
          width="100"
          height="100"
          className="transform -rotate-90 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#22d3ee" // cyan-400
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
      </div>
    </GlassCard>
  );
}
