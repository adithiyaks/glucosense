"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface HeartRateCardProps {
  currentHR: number;
  data: { time: string; hr: number }[];
}

export function HeartRateCard({ currentHR, data }: HeartRateCardProps) {
  return (
    <GlassCard className="flex flex-col h-48 justify-between relative group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
            Heart Rate
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-50 font-mono tracking-tight">
              {currentHR}
            </span>
            <span className="text-sm font-medium text-slate-400">bpm</span>
          </div>
        </div>
        <div className="p-2 bg-rose-500/10 rounded-lg">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 60 / Math.max(currentHR, 60), // pulse based on HR roughly
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500/20 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
            <Line
              type="monotone"
              dataKey="hr"
              stroke="#f43f5e" // rose-500
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              style={{
                filter: "drop-shadow(0px 4px 8px rgba(244, 63, 94, 0.4))",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
