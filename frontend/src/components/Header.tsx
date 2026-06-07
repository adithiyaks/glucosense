"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between w-full py-6 px-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/5">
          <Activity className="w-6 h-6 text-slate-100" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Allostasis Autonomic Command
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            NEUROBIOLOGICAL HEALTH MONITOR
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="relative flex h-3 w-3">
          <motion.span
            animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
          ></motion.span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        </div>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          System Live
        </span>
      </div>
    </header>
  );
}
