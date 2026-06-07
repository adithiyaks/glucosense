"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Thermometer,
  Move3d,
  TrendingUp,
  Gauge,
  Info
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

// Types for data structures
interface TelemetryPacket {
  x: number;
  y: number;
  z: number;
  temperature: number;
  heart_rate?: number;
  spo2?: number;
  timestamp: string;
}

interface ChartDataPoint {
  index: number;
  time: string;
  x: number;
  y: number;
  z: number;
}

// Subcomponent to animate number changes smoothly
function SmoothNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const controls = animate(prevValueRef.current, value, {
      duration: 0.15,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      }
    });
    prevValueRef.current = value;
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}</span>;
}

export default function SensorDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<
    "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "RECONNECTING"
  >("DISCONNECTED");
  const [latestData, setLatestData] = useState<TelemetryPacket>({
    x: 0,
    y: 0,
    z: 1.0,
    temperature: 36.5,
    timestamp: new Date().toLocaleTimeString()
  });
  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [wsUrl, setWsUrl] = useState("wss://glucosense-0y79.onrender.com/ws/sensor");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataCounterRef = useRef(0);

  // Parse websocket payload dynamically to handle different naming schemas
  const parsePayload = (rawString: string): TelemetryPacket | null => {
    try {
      const parsed = JSON.parse(rawString);

      let x = 0;
      let y = 0;
      let z = 1.0;
      let temp = 36.5;
      let hr = 72;
      let spo2 = 98;

      // Motion / Kinematics extraction
      if (parsed.motion) {
        x = parsed.motion.accel_x ?? parsed.motion.accX ?? 0;
        y = parsed.motion.accel_y ?? parsed.motion.accY ?? 0;
        z = parsed.motion.accel_z ?? parsed.motion.accZ ?? 1.0;
      } else {
        x = parsed.accel_x ?? parsed.accX ?? parsed.x ?? 0;
        y = parsed.accel_y ?? parsed.accY ?? parsed.y ?? 0;
        z = parsed.accel_z ?? parsed.accZ ?? parsed.z ?? 1.0;
      }

      // Biometrics / Temperature extraction
      if (parsed.biometrics) {
        temp = parsed.biometrics.temperature ?? parsed.biometrics.temp ?? 36.5;
        hr = parsed.biometrics.heart_rate ?? parsed.biometrics.hr ?? 72;
        spo2 = parsed.biometrics.spo2 ?? 98;
      } else {
        temp = parsed.temperature ?? parsed.temp ?? parsed.t ?? 36.5;
        hr = parsed.heart_rate ?? parsed.hr ?? parsed.bpm ?? 72;
        spo2 = parsed.spo2 ?? parsed.o2 ?? 98;
      }

      return {
        x,
        y,
        z,
        temperature: temp,
        heart_rate: hr,
        spo2: spo2,
        timestamp: parsed.timestamp || new Date().toLocaleTimeString()
      };
    } catch (err) {
      console.error("Payload parsing error:", err);
      return null;
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus((prev) =>
      prev === "DISCONNECTED" ? "CONNECTING" : "RECONNECTING"
    );

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("CONNECTED");
        console.log("WebSocket Connection Established:", wsUrl);
      };

      ws.onmessage = (event) => {
        const parsed = parsePayload(event.data);
        if (parsed) {
          setMessageCount((c) => c + 1);
          setLatestData(parsed);

          // Update scrolling chart history
          setChartHistory((prev) => {
            dataCounterRef.current += 1;
            const newPoint: ChartDataPoint = {
              index: dataCounterRef.current,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              x: parsed.x,
              y: parsed.y,
              z: parsed.z
            };
            const nextHistory = [...prev, newPoint];
            return nextHistory.slice(-50); // Keep last 50 points
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      ws.onclose = () => {
        setConnectionStatus("DISCONNECTED");
        console.log("WebSocket Connection Closed. Reattempting in 2s...");
        // Auto-reconnect loop
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
    } catch (err) {
      console.error("WebSocket Connection Exception:", err);
      setConnectionStatus("DISCONNECTED");
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop trigger on manual unmount
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsUrl]);

  // Compute metrics
  const totalG = Math.sqrt(latestData.x ** 2 + latestData.y ** 2 + latestData.z ** 2);

  // Normalize temp for gauge: Min 30C, Max 45C
  const minTemp = 30;
  const maxTemp = 45;
  const tempRange = maxTemp - minTemp;
  const tempPct = Math.min(Math.max((latestData.temperature - minTemp) / tempRange, 0), 1);
  const gaugeCircumference = 2 * Math.PI * 52;
  const strokeDashoffset = gaugeCircumference - tempPct * gaugeCircumference;

  // Decide thermal state color and label
  const getThermalStatus = (temp: number) => {
    if (temp < 35.0) return { label: "Hypothermia", color: "text-blue-400", bg: "bg-blue-500/10" };
    if (temp > 38.0) return { label: "Hyperthermia", color: "text-red-500", bg: "bg-red-500/10" };
    if (temp > 37.2) return { label: "Elevated", color: "text-amber-400", bg: "bg-amber-500/10" };
    return { label: "Homeostasis", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  };

  const thermalState = getThermalStatus(latestData.temperature);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6 text-slate-100 min-h-screen flex flex-col justify-between">
      {/* Premium Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Live Wearable Telemetry
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span>M5STACK / ESP32 HARDWARE STREAM</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="font-mono text-cyan-400/90">~10Hz WebSocket Feed</span>
            </p>
          </div>
        </div>

        {/* WebSocket Controls & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Pill */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="relative flex h-2.5 w-2.5">
              {connectionStatus === "CONNECTED" && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                </>
              )}
              {(connectionStatus === "CONNECTING" || connectionStatus === "RECONNECTING") && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                </>
              )}
              {connectionStatus === "DISCONNECTED" && (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
              )}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${connectionStatus === "CONNECTED" ? "text-emerald-400" :
                connectionStatus === "DISCONNECTED" ? "text-red-400" : "text-amber-400"
              }`}>
              {connectionStatus}
            </span>
          </div>

          {/* Config URL Button */}
          <div className="flex items-center rounded-2xl overflow-hidden bg-slate-950/60 border border-slate-800/80 p-0.5">
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-xs font-mono text-slate-300 w-44 md:w-56 focus:outline-none focus:ring-0"
              placeholder="ws://localhost:8000/..."
            />
            <button
              onClick={connectWebSocket}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer m-1"
              title="Manual Reconnect"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex flex-col text-right font-mono text-[10px] text-slate-500">
            <span>PACKETS: {messageCount}</span>
            <span>STATUS: ACTIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Bento Box Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Live Kinematic Waveforms (Main Chart) - Span 2 Cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden relative group backdrop-blur-md shadow-2xl h-[420px] flex flex-col justify-between p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />

          <div className="flex justify-between items-start mb-4 z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-50 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Kinematic Waveform Analysis
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Real-time mapping of acceleration forces (X, Y, Z axes)
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> X
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Y
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Z
              </span>
            </div>
          </div>

          {/* Scrolling Line Chart */}
          <div className="flex-grow w-full h-[280px] mt-2 relative">
            {chartHistory.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800/40">
                <Activity className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-mono">Awaiting WebSocket Stream...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartHistory}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorZ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/40" vertical={false} />
                  <XAxis
                    dataKey="index"
                    hide
                  />
                  <YAxis
                    domain={[-3, 3]}
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="x"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="z"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            <span>X, Y, and Z show acceleration values in g-forces. Dynamic scaling: ±3g.</span>
          </div>
        </motion.div>

        {/* Card 2: Thermal Core (Circular Temperature Gauge) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden relative group backdrop-blur-md shadow-2xl h-[420px] flex flex-col justify-between p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] to-transparent pointer-events-none" />

          <div>
            <h2 className="text-lg font-bold text-slate-50 tracking-tight flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-400" />
              Thermal Core State
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Live body temperature reading (MPU6050 Internal/External Sensor)
            </p>
          </div>

          {/* Circular SVG Gauge */}
          <div className="flex-grow flex items-center justify-center relative my-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" /> {/* Cool Blue */}
                    <stop offset="50%" stopColor="#eab308" /> {/* Yellow Normal */}
                    <stop offset="100%" stopColor="#ef4444" /> {/* Hot Red */}
                  </linearGradient>
                  <filter id="glowCircle">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Track Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-slate-800/60"
                  strokeWidth="8"
                  fill="transparent"
                />

                {/* Animated Value Ring */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="url(#tempGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={gaugeCircumference}
                  animate={{ strokeDashoffset }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  strokeLinecap="round"
                  filter="url(#glowCircle)"
                />
              </svg>

              {/* Centered Values */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono tracking-tighter text-slate-50 flex items-start">
                  <SmoothNumber value={latestData.temperature} decimals={1} />
                  <span className="text-base text-slate-400 font-bold ml-0.5">°C</span>
                </span>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${thermalState.bg} ${thermalState.color} mt-1.5 border border-white/5`}>
                  {thermalState.label}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Info / Progress stats */}
          <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 text-xs font-mono">
            <div className="text-left">
              <span className="text-slate-500 block text-[10px] uppercase">Low Limit</span>
              <span className="text-slate-300 font-bold">30.0 °C</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block text-[10px] uppercase">Reference</span>
              <span className="text-slate-300 font-bold">37.0 °C</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">High Limit</span>
              <span className="text-slate-300 font-bold">45.0 °C</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: 3D Kinematic Matrix Orientation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden relative group backdrop-blur-md shadow-2xl h-[340px] md:h-[380px] lg:h-[400px] flex flex-col justify-between p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />

          <div>
            <h2 className="text-lg font-bold text-slate-50 tracking-tight flex items-center gap-2">
              <Move3d className="w-5 h-5 text-purple-400" />
              Orientation Matrix
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              3D simulation of spatial posture mapping
            </p>
          </div>

          {/* Interactive/Live 3D Cube */}
          <div className="flex-grow flex items-center justify-center relative perspective-[1000px] my-6">
            <motion.div
              className="w-20 h-20 relative preserve-3d"
              animate={{
                rotateX: -latestData.y * 45, // Pitch
                rotateY: latestData.x * 45, // Roll
              }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Faces of the MPU representation */}
              <div className="absolute inset-0 border-2 border-purple-500/60 bg-purple-500/10 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] transform -translate-z-5 rounded-xl" />
              <div className="absolute inset-0 border-2 border-purple-400/50 bg-purple-950/20 transform translate-z-5 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              </div>

              {/* Grid / Axis guides */}
              <div className="absolute top-1/2 left-1/2 w-[160%] h-px bg-rose-500/40 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 h-[160%] w-px bg-emerald-500/40 transform -translate-x-1/2 -translate-y-1/2" />
            </motion.div>
          </div>

          {/* Vector Magnitude */}
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-3 flex justify-between items-center font-mono text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Composite Vector:</span>
            <span className="text-purple-400 font-bold flex items-center gap-1.5">
              <SmoothNumber value={totalG} decimals={3} />
              <span className="text-slate-500 font-normal">g</span>
            </span>
          </div>
        </motion.div>

        {/* Card 4: Vector Component Biometrics - 2 cols on wide display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden relative group backdrop-blur-md shadow-2xl h-[340px] md:h-[380px] lg:h-[400px] flex flex-col justify-between p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />

          <div>
            <h2 className="text-lg font-bold text-slate-50 tracking-tight flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-400" />
              Vector Components
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Real-time gravity vector metrics from MPU6050 Accelerometer
            </p>
          </div>

          {/* Bar Gauges for X, Y, Z */}
          <div className="flex-grow flex flex-col justify-center space-y-4 my-4 font-mono">
            {/* Axis X */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-bold">ACCELERATION X</span>
                <span className="text-slate-200 font-semibold">
                  <SmoothNumber value={latestData.x} /> g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950/60 border border-slate-800/80 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  animate={{ width: `${Math.min(Math.abs(latestData.x) * 100, 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                />
              </div>
            </div>

            {/* Axis Y */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-400 font-bold">ACCELERATION Y</span>
                <span className="text-slate-200 font-semibold">
                  <SmoothNumber value={latestData.y} /> g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950/60 border border-slate-800/80 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ width: `${Math.min(Math.abs(latestData.y) * 100, 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                />
              </div>
            </div>

            {/* Axis Z */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-pink-400 font-bold">ACCELERATION Z (NORMALIZED)</span>
                <span className="text-slate-200 font-semibold">
                  <SmoothNumber value={latestData.z} /> g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950/60 border border-slate-800/80 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                  animate={{ width: `${Math.min(Math.abs(latestData.z) * 100, 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics stats */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/40 pt-4 font-mono text-xs">
            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/30 text-center">
              <span className="text-slate-500 text-[10px] block">PEAK FORCE</span>
              <span className="text-slate-200 font-bold">1.42 g</span>
            </div>
            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/30 text-center">
              <span className="text-slate-500 text-[10px] block">DYNAMIC DELTA</span>
              <span className="text-slate-200 font-bold">0.05 g</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Footer Diagnostic Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-8 py-4 px-6 bg-slate-900/10 border border-slate-900 rounded-2xl text-[11px] text-slate-500 font-mono"
      >
        <span>GLUCOSENSE WEARABLE TELEMETRY NODE #01</span>
        <span>CONNECTED VIA ATOMS-WS PROTOCOL v1.0.0</span>
      </motion.div>
    </div>
  );
}
