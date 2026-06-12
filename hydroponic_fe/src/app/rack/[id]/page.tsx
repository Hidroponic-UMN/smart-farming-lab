"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRackHistory, TimeRange, SensorHistory } from "@/lib/useRackHistory";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Droplets, Thermometer, Sun, Gauge,
  Waves, FlaskConical, Maximize2, Calendar, Download
} from "lucide-react";
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";

export const dynamic = "force-dynamic"


const SENSOR_COLORS: Record<string, string> = {
  ph: "#10b981",
  ec: "#3b82f6",
  water_temp: "#f59e0b",
  water_level: "#06b6d4",
  water_flow: "#8b5cf6",
  light_intensity: "#f97316",
  temperature: "#f59e0b",
  humidity: "#3b82f6",
};

const SENSOR_ICONS: Record<string, React.ReactNode> = {
  ph: <FlaskConical className="size-4" />,
  ec: <Gauge className="size-4" />,
  water_temp: <Thermometer className="size-4" />,
  water_level: <Droplets className="size-4" />,
  water_flow: <Waves className="size-4" />,
  light_intensity: <Sun className="size-4" />,
  temperature: <Thermometer className="size-4" />,
  humidity: <Droplets className="size-4" />,
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " " + 
         date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function SensorChart({
  sensor, rackId, compact = false,
}: {
  sensor: SensorHistory; rackId: string; compact?: boolean;
}) {
  const color = SENSOR_COLORS[sensor.sensor_type] || "#10b981";
  const icon = SENSOR_ICONS[sensor.sensor_type];
  const latestValue = sensor.data.length > 0
    ? sensor.data[sensor.data.length - 1].value : null;

  const chartData = sensor.data.map((d) => ({
    time: formatTime(d.timestamp),
    value: d.value,
    fullTime: new Date(d.timestamp).toLocaleString("id-ID"),
  }));

  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 border border-white/40 shadow-sm">
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#34473d]">{sensor.label}</h3>
            <p className="text-xs font-semibold text-[#34473d]/60">{sensor.unit}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestValue !== null && (
            <Badge variant="outline" className="text-xs font-mono font-bold bg-white/50 border-white/30 text-[#34473d] px-2 py-1">
              {sensor.sensor_type === "light_intensity"
                ? Math.round(latestValue).toLocaleString()
                : latestValue.toFixed(sensor.sensor_type === "ph" || sensor.sensor_type === "ec" ? 2 : 1)}{" "}
              {sensor.unit}
            </Badge>
          )}
          {compact && (
            <Link href={`/rack/${rackId}/${sensor.sensor_type}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#34473d]/60 hover:text-[#34473d] hover:bg-white/50 rounded-lg">
                <span className="sr-only">Details</span>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className={compact ? "h-[120px]" : "h-[250px]"}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <defs>
                <linearGradient id={`grad-${sensor.sensor_type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#34473d", opacity: 0.7, fontWeight: 600 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#34473d", opacity: 0.7, fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", color: "#34473d" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTime || ""}
                itemStyle={{ color: color }}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#grad-${sensor.sensor_type})`} dot={false} activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[#34473d]/60 text-xs font-semibold">
            Belum ada data untuk rentang waktu ini
          </div>
        )}
      </div>
      <div className="mt-3 text-right">
        <span className="text-[10px] font-bold text-[#34473d]/50 bg-white/30 px-2 py-1 rounded-full">{chartData.length} entries</span>
      </div>
    </div>
  );
}

export default function RackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rackId = params.id as string;

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const { data, loading, error } = useRackHistory(parseInt(rackId), startDate, endDate);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    if (!newStart) return;
    setStartDate(newStart);
    
    const startD = new Date(newStart);
    const endD = new Date(endDate);
    const diff = (endD.getTime() - startD.getTime()) / (1000 * 3600 * 24);
    if (diff > 7) {
      const newEnd = new Date(startD);
      newEnd.setDate(startD.getDate() + 7);
      setEndDate(newEnd.toISOString().split("T")[0]);
    } else if (diff < 0) {
      setEndDate(newStart);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    if (!newEnd) return;
    setEndDate(newEnd);
    
    const startD = new Date(startDate);
    const endD = new Date(newEnd);
    const diff = (endD.getTime() - startD.getTime()) / (1000 * 3600 * 24);
    if (diff > 7) {
      const newStart = new Date(endD);
      newStart.setDate(endD.getDate() - 7);
      setStartDate(newStart.toISOString().split("T")[0]);
    } else if (diff < 0) {
      setStartDate(newEnd);
    }
  };

  return (
    <div className="min-h-screen w-screen relative overflow-x-hidden flex flex-col font-sans bg-[#f5f4f0]">
      {/* Background Section Top */}
      <div 
        className="absolute top-0 left-0 w-full h-[350px] bg-cover bg-center z-0 rounded-b-[30px] overflow-hidden"
        style={{ backgroundImage: `url(${bgTop.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-6 md:p-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/history")} className="gap-2 text-[#34473d] hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 rounded-xl">
              <ArrowLeft className="size-4" /> Back to History
            </Button>
            <div className="pt-2">
              <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">{data?.rack_label || (rackId === "0" ? "Room Monitor" : `Rack ${rackId}`)}</h1>
              <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                Grafik detail riwayat sensor
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-end mt-4 md:mt-0">
            <a href={`/api/export/csv?rack_id=${rackId}&start_date=${startDate}&end_date=${endDate}`} target="_blank" rel="noreferrer">
              <Button variant="outline" className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 rounded-xl font-bold shadow-md hover:bg-white/60 hover:text-[#50705f] transition-colors w-fit">
                <Download className="w-4 h-4 mr-2" />
                Export Data (CSV)
              </Button>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/40 backdrop-blur-md rounded-2xl p-3 w-full sm:w-max shadow-xl border border-white/20">
            <div className="flex items-center gap-2 px-2 text-[#34473d] font-bold text-sm uppercase tracking-wider">
              <Calendar className="w-4 h-4" /> Range
            </div>
            <div className="h-8 w-px bg-white/40 hidden sm:block mx-2" />
            <div className="flex items-center bg-white/50 rounded-xl border border-white/30 px-3 h-11 shadow-inner focus-within:border-[#50705f] transition-colors w-full sm:w-auto">
              <span className="text-[#34473d]/60 text-xs font-bold mr-2 uppercase tracking-wider">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={handleStartDateChange}
                className="bg-transparent text-sm outline-none text-[#34473d] font-bold [&::-webkit-calendar-picker-indicator]:cursor-pointer w-[130px]" 
              />
            </div>
            <span className="text-[#34473d]/40 font-bold hidden sm:block">-</span>
            <div className="flex items-center bg-white/50 rounded-xl border border-white/30 px-3 h-11 shadow-inner focus-within:border-[#50705f] transition-colors w-full sm:w-auto">
              <span className="text-[#34473d]/60 text-xs font-bold mr-2 uppercase tracking-wider">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={handleEndDateChange}
                className="bg-transparent text-sm outline-none text-[#34473d] font-bold [&::-webkit-calendar-picker-indicator]:cursor-pointer w-[130px]" 
              />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="w-full">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/30 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl">
              <div className="w-3 h-3 rounded-full bg-[#50705f] animate-pulse" />
              <span className="text-sm font-bold text-[#34473d]/60 mt-4 uppercase tracking-widest">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/30 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl text-center px-4">
              <p className="text-rose-600 font-bold text-xl mb-2">{error}</p>
              <p className="text-[#34473d]/60 text-sm font-medium">Pastikan API backend sedang berjalan normal</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.sensors.map((sensor) => (
                <SensorChart key={sensor.sensor_type} sensor={sensor} rackId={rackId} compact={false} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
