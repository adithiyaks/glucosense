"use client";

import SensorDashboard from "@/components/dashboard/SensorDashboard";

export default function Dashboard() {
  return (
    <main className="mesh-bg min-h-screen w-full relative bg-slate-950">
      {/* Subtle overlay to enhance glassmorphism contrast */}
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <SensorDashboard />
      </div>
    </main>
  );
}

