"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeartRateCard } from "@/components/dashboard/HeartRateCard";
import { SpO2Card } from "@/components/dashboard/SpO2Card";
import { CoreTempCard } from "@/components/dashboard/CoreTempCard";
import { AllostaticLoadChart } from "@/components/dashboard/AllostaticLoadChart";
import { KinematicFeed } from "@/components/dashboard/KinematicFeed";

// Types matching the provided JSON structure
interface TelemetryData {
  patient_id: string;
  timestamp: string;
  biometrics: {
    heart_rate: number;
    spo2: number;
    temperature: number;
  };
  motion: {
    accel_x: number;
    accel_y: number;
    accel_z: number;
  };
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  
  // Historical data for charts
  const [hrHistory, setHrHistory] = useState<{ time: string; hr: number }[]>([]);
  const [loadHistory, setLoadHistory] = useState<{ time: string; stress: number; recovery: number }[]>([]);

  useEffect(() => {
    // Initial mock data to populate charts immediately for visual feedback
    const now = new Date();
    const initialHr = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(now.getTime() - (20 - i) * 2000).toLocaleTimeString(),
      hr: 60 + Math.random() * 20,
    }));
    setHrHistory(initialHr);

    const initialLoad = Array.from({ length: 20 }).map((_, i) => {
      const stressBase = 40 + Math.random() * 30;
      return {
        time: new Date(now.getTime() - (20 - i) * 2000).toLocaleTimeString(),
        stress: stressBase,
        recovery: 100 - stressBase + (Math.random() * 10 - 5),
      };
    });
    setLoadHistory(initialLoad);

    const fetchTelemetry = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/telemetry/patient_001");
        if (response.ok) {
          const data: TelemetryData = await response.json();
          updateStateWithData(data);
        } else {
          // If backend is not running, we simulate data to maintain the kinematic feel
          simulateData();
        }
      } catch (error) {
        // Fallback to simulation for demonstration purposes
        simulateData();
      }
    };

    const updateStateWithData = (data: TelemetryData) => {
      setTelemetry(data);
      const timeStr = new Date(data.timestamp || Date.now()).toLocaleTimeString();
      
      setHrHistory((prev) => {
        const next = [...prev, { time: timeStr, hr: data.biometrics.heart_rate }];
        return next.slice(-20); // Keep last 20 points
      });

      setLoadHistory((prev) => {
        // Mocking a calculation for stress/recovery based on HR and Temp for visualization
        const stress = (data.biometrics.heart_rate - 60) * 1.5 + (data.biometrics.temperature - 36) * 10;
        const recovery = data.biometrics.spo2 - (stress * 0.2);
        const next = [...prev, { time: timeStr, stress, recovery }];
        return next.slice(-20); // Keep last 20 points
      });
    };

    const simulateData = () => {
      const now = new Date();
      const simData: TelemetryData = {
        patient_id: "patient_001",
        timestamp: now.toISOString(),
        biometrics: {
          heart_rate: Math.floor(65 + Math.random() * 15),
          spo2: Math.floor(95 + Math.random() * 5),
          temperature: +(36.5 + Math.random() * 0.5).toFixed(1),
        },
        motion: {
          accel_x: +(Math.random() * 2 - 1).toFixed(2),
          accel_y: +(Math.random() * 2 - 1).toFixed(2),
          accel_z: +(0.8 + Math.random() * 0.4).toFixed(2),
        }
      };
      updateStateWithData(simData);
    };

    // Initial fetch/sim
    fetchTelemetry();

    // Poll every 2 seconds
    const intervalId = setInterval(fetchTelemetry, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="mesh-bg min-h-screen w-full relative">
      {/* Subtle overlay to enhance glassmorphism contrast */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <Header />
        
        <DashboardLayout>
          {/* Top Row: Vitals */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1">
            <HeartRateCard 
              currentHR={telemetry?.biometrics.heart_rate || 72} 
              data={hrHistory} 
            />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1">
            <SpO2Card 
              spo2={telemetry?.biometrics.spo2 || 98} 
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1">
            <CoreTempCard 
              temperature={telemetry?.biometrics.temperature || 36.6} 
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <KinematicFeed 
              motionData={telemetry?.motion || { accel_x: 0, accel_y: 0, accel_z: 1 }} 
            />
          </div>

          {/* Bottom Row: Allostatic Load Hero Card */}
          <AllostaticLoadChart data={loadHistory} />
        </DashboardLayout>
      </div>
    </main>
  );
}
