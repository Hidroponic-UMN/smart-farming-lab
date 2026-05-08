"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Gauge,
    Zap,
    Sun,
    Droplets,
    Thermometer,
    TrendingUp,
    Circle,
    Activity,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RackData, SensorData } from "@/lib/sensor-data";
import {
    getStatusColor,
    getStatusBg,
    getProgressColor,
    THRESHOLDS,
} from "@/lib/thresholds";
import type { Status } from "@/lib/thresholds";
import { MiniChart } from "./mini-chart";

/** Calculate real trend % from sensor history (recent avg vs older avg) */
function calcTrend(sensor: SensorData): number {
    const h = sensor.history;
    if (h.length < 10) return 0;
    const recentSlice = h.slice(-5);
    const olderSlice = h.slice(-10, -5);
    const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
    const olderAvg = olderSlice.reduce((a, b) => a + b, 0) / olderSlice.length;
    if (olderAvg === 0) return 0;
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

interface SensorCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    unit: string;
    status: Status;
    decimals: number;
    type: string;
    tooltip: string;
    trend?: number;
    variant?: "default" | "inverted";
    badgePosition?: "side" | "bottom";
}

function SensorCard({
    icon: Icon,
    label,
    value,
    unit,
    status,
    decimals,
    type,
    tooltip,
    trend,
    variant = "default",
    badgePosition = "side",
}: SensorCardProps) {
    const config = THRESHOLDS[type];
    const progressPercent = config
        ? ((value - config.min) / (config.max - config.min)) * 100
        : 50;
    const isInverted = variant === "inverted";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="group cursor-pointer h-full">
                    <div className={`relative rounded-xl p-3 backdrop-blur-sm shadow-md transition-all duration-300 h-full flex flex-col justify-between ${
                        status !== "Normal"
                            ? getStatusBg(status)
                            : type === "lightIntensity"
                                ? "bg-gradient-to-tl from-[#e9e6de] to-white"
                                : isInverted
                                    ? "bg-gray-900/40 dark:bg-gray-950/40"
                                    : "bg-white/50 dark:bg-gray-900/40"
                        }`}>
                        {/* Header */}
                        <div className={`flex ${badgePosition === "bottom" ? "flex-col items-start gap-0.5" : "items-start justify-between"} mb-2`}>
                            <div className="flex items-center gap-1.5">
                                <div className={`p-1.5 rounded-lg ${getStatusBg(status)}/10`}>
                                    <Icon className={`w-3.5 h-3.5 ${getStatusColor(status)}`} />
                                </div>
                                <span className={`text-[10px] font-bold ${isInverted ? "text-gray-300 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"} uppercase tracking-tight`}>
                                    {label}
                                </span>
                            </div>
                            <div className={`${badgePosition === "bottom" ? "text-[10px] pl-8" : "text-[10px] px-1.5 py-0.5"} font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                                {status}
                            </div>
                        </div>

                        {/* Value */}
                        <div className="flex items-baseline justify-center gap-1 mb-1">
                            <span className={`text-xl font-bold tabular-nums ${getStatusColor(status)}`}>
                                {value.toFixed(decimals)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {unit}
                            </span>
                            {trend !== undefined && trend !== 0 && (
                                <div className={`ml-2 flex items-center gap-0.5 text-[10px] font-medium ${trend > 0 ? 'text-[#34473d]' : 'text-rose-600'
                                    }`}>
                                    <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                                    <span>{Math.abs(trend)}%</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className={`relative h-1.5 rounded-full overflow-hidden ${isInverted ? "bg-gray-800 dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-800"}`}>
                            <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-full ${getProgressColor(status)}`}
                                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
                <p className="font-medium text-xs">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

interface RackCardHorizontalProps {
    rack: RackData;
}

export function RackCardHorizontal({ rack }: RackCardHorizontalProps) {
    return (
        <Card className="relative overflow-hidden bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 min-w-[1200px]">
            <CardContent className="p-4 flex flex-row items-stretch gap-6">

                {/* 1. Rack Label Section */}
                <div className="flex flex-col min-w-[150px] border-r border-white/20 pr-4">
                    {/* Header Spacer (to align with other sections) */}
                    <div className="flex-1 w-full rounded-2xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white flex items-center justify-center font-bold text-xl shadow-lg border-none text-center">
                        {rack.label}
                    </div>
                </div>

                {/* 2. On Rack Sensors (Light & Water Flow) */}
                <div className="flex flex-col flex-1 border-r border-white/20 pr-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#34473d]/50 mb-3 flex items-center gap-2">
                        <Circle className="w-1 h-1 fill-current" /> On Rack Sensors
                    </h4>
                    <div className="flex-1 flex flex-row gap-4 items-stretch">
                        {/* Light Sensor */}
                        <div className="flex-1">
                            <SensorCard
                                icon={Sun}
                                label="Light"
                                value={rack.lightIntensity.value}
                                unit="lux"
                                status={rack.lightIntensity.status}
                                decimals={0}
                                type="lightIntensity"
                                tooltip="LED grow light intensity"
                                trend={calcTrend(rack.lightIntensity)}
                            />
                        </div>

                        {/* Water Flow */}
                        <div className={`flex-[1.2] backdrop-blur-sm rounded-xl p-3 shadow-md flex flex-col justify-between ${
                            rack.waterFlow.status !== "Normal"
                                ? getStatusBg(rack.waterFlow.status)
                                : "bg-gradient-to-tl from-[#7f9c8c]/20 to-white/40"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-[#34473d]/50" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">Water Flow</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`px-2 py-0 text-[10px] font-bold border-none ${getStatusColor(rack.waterFlow.status)}`}>
                                        {rack.waterFlow.status}
                                    </Badge>
                                    <span className={`text-sm font-bold tabular-nums ${getStatusColor(rack.waterFlow.status)}`}>
                                        {rack.waterFlow.value.toFixed(1)} <span className="text-[10px] opacity-60">L/min</span>
                                    </span>
                                </div>
                            </div>
                            <div className="h-10">
                                <MiniChart
                                    data={rack.waterFlow.history}
                                    status={rack.waterFlow.status}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Tank Sensors */}
                <div className="flex flex-col flex-[2.5]">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#34473d]/50 mb-3 flex items-center gap-2">
                        <Circle className="w-1 h-1 fill-current" /> Tank Sensors
                    </h4>
                    <div className="grid grid-cols-4 gap-3 flex-1">
                        <SensorCard
                            icon={Droplets}
                            label="Water Level"
                            value={rack.waterLevel.value}
                            unit="%"
                            status={rack.waterLevel.status}
                            decimals={0}
                            type="waterLevel"
                            tooltip="Tank water level"
                            trend={calcTrend(rack.waterLevel)}
                        />
                        <SensorCard
                            icon={Gauge}
                            label="pH Level"
                            value={rack.ph.value}
                            unit="pH"
                            status={rack.ph.status}
                            decimals={2}
                            type="ph"
                            tooltip="Water pH level"
                            trend={calcTrend(rack.ph)}
                        />
                        <SensorCard
                            icon={Zap}
                            label="Nutrition"
                            value={rack.ec.value}
                            unit="mS/cm"
                            status={rack.ec.status}
                            decimals={2}
                            type="ec"
                            tooltip="Nutrient concentration"
                            trend={calcTrend(rack.ec)}
                        />
                        <SensorCard
                            icon={Thermometer}
                            label="Water Temp"
                            value={rack.waterTemp.value}
                            unit="°C"
                            status={rack.waterTemp.status}
                            decimals={1}
                            type="waterTemp"
                            tooltip="Water temperature"
                            trend={calcTrend(rack.waterTemp)}
                        />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
