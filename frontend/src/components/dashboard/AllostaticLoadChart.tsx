"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ActivitySquare } from "lucide-react";

interface AllostaticLoadChartProps {
  data: { time: string; stress: number; recovery: number }[];
}

export function AllostaticLoadChart({ data }: AllostaticLoadChartProps) {
  return (
    <GlassCard className="col-span-full xl:col-span-2 h-[400px] flex flex-col relative group" disableFloat>
      <div className="flex justify-between items-start z-10 relative mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-50 tracking-tight">
            Allostatic Load
          </h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Stress vs Recovery Divergence
          </p>
        </div>
        <div className="p-2 bg-indigo-500/10 rounded-xl">
          <ActivitySquare className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      <div className="flex-grow w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(2, 6, 23, 0.8)",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
                color: "#f8fafc",
              }}
              itemStyle={{ color: "#f8fafc" }}
            />
            <Area
              type="monotone"
              dataKey="stress"
              stroke="#f43f5e"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorStress)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="recovery"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRecovery)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
