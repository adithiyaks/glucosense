"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Thermometer } from "lucide-react";
import { motion } from "framer-motion";

interface CoreTempCardProps {
  temperature: number;
}

export function CoreTempCard({ temperature }: CoreTempCardProps) {
  // simple indicator color based on temp
  const isHigh = temperature > 37.5;
  const colorClass = isHigh ? "text-amber-400" : "text-slate-50";
  const bgClass = isHigh ? "bg-amber-500/10" : "bg-white/10";
  const iconClass = isHigh ? "text-amber-400" : "text-slate-300";

  return (
    <GlassCard className="flex flex-col h-48 justify-between relative group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
            Core Temp
          </p>
        </div>
        <div className={`p-2 rounded-lg ${bgClass} transition-colors duration-500`}>
          <Thermometer className={`w-6 h-6 ${iconClass}`} />
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-xl" />
        <motion.div
          key={temperature}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline gap-1"
        >
          <span
            className={`text-6xl font-bold font-mono tracking-tighter ${colorClass} drop-shadow-md`}
          >
            {temperature.toFixed(1)}
          </span>
          <span className="text-xl font-medium text-slate-400">°C</span>
        </motion.div>
      </div>
    </GlassCard>
  );
}
