"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Move3d } from "lucide-react";
import { motion } from "framer-motion";

interface KinematicFeedProps {
  motionData: { accel_x: number; accel_y: number; accel_z: number };
}

export function KinematicFeed({ motionData }: KinematicFeedProps) {
  const { accel_x, accel_y, accel_z } = motionData;

  // Map accelerometer data to rotation angles roughly
  const rotateX = accel_y * 90; // Pitch
  const rotateY = accel_x * 90; // Roll
  // accel_z usually 1g when flat, we can map it to scale or just leave z as is

  return (
    <GlassCard className="h-full min-h-[300px] flex flex-col relative group overflow-hidden">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h2 className="text-xl font-semibold text-slate-50 tracking-tight">
            Kinematic Feed
          </h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            MPU6050 Spatial Matrix
          </p>
        </div>
        <div className="p-2 bg-purple-500/10 rounded-xl">
          <Move3d className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative perspective-[1000px]">
        {/* 3D Object Visualization */}
        <motion.div
          className="w-24 h-24 relative preserve-3d"
          animate={{
            rotateX: -rotateX,
            rotateY: rotateY,
          }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Faces of the cube/plane to represent the sensor */}
          <div className="absolute inset-0 border-2 border-purple-500/50 bg-purple-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.5)] transform -translate-z-6"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>
          </div>
          
          {/* Axis lines */}
          <div className="absolute top-1/2 left-1/2 w-[150%] h-px bg-red-500/50 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> {/* X */}
          <div className="absolute top-1/2 left-1/2 h-[150%] w-px bg-green-500/50 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> {/* Y */}
          <div className="absolute top-1/2 left-1/2 w-px h-[150%] bg-blue-500/50 transform -translate-x-1/2 -translate-y-1/2 rotate-90 rotate-x-90 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> {/* Z */}
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto z-10 font-mono text-sm">
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
          <p className="text-red-400 text-xs mb-1">X</p>
          <p className="text-slate-200">{accel_x.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
          <p className="text-green-400 text-xs mb-1">Y</p>
          <p className="text-slate-200">{accel_y.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
          <p className="text-blue-400 text-xs mb-1">Z</p>
          <p className="text-slate-200">{accel_z.toFixed(2)}</p>
        </div>
      </div>
    </GlassCard>
  );
}
