"use client";

import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Gauge,
    Zap,
    Waves,
    Sun,
    Droplets,
    Thermometer,
    Activity,
    Circle,
    TrendingUp,
    CalendarIcon,
    Sprout,
} from "lucide-react";
import type { RackData, SensorData } from "@/lib/sensor-data";
import {
    getStatusColor,
    getStatusBg,
    getStatusDot,
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

interface RackCardProps {
    rack: RackData;
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
    badgePosition?: "side" | "bottom" | "responsive";
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
                <div className="group cursor-pointer">
                    <div className={`relative rounded-xl p-3 backdrop-blur-sm shadow-md transition-all duration-300 ${status !== "Normal"
                            ? getStatusBg(status)
                            : type === "lightIntensity"
                                ? "bg-gradient-to-tl from-[#e9e6de] to-white"
                                : isInverted
                                    ? "bg-gray-900/40 dark:bg-gray-950/40"
                                    : "bg-white/50 dark:bg-gray-900/40"
                        }`}>
                        {/* Header */}
                        <div className={`flex ${badgePosition === "bottom"
                            ? "flex-col items-start gap-0.5"
                            : badgePosition === "responsive"
                                ? "flex-col 2xl:flex-row 2xl:items-start 2xl:justify-between gap-0.5 2xl:gap-0"
                                : "items-start justify-between"
                            } mb-2`}>
                            <div className="flex items-center gap-1.5">
                                <div className={`p-1.5 rounded-lg ${getStatusBg(status)}/10`}>
                                    <Icon className={`w-3.5 h-3.5 ${getStatusColor(status)}`} />
                                </div>
                                <span className={`text-xs font-medium ${isInverted ? "text-gray-300 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
                                    {label}
                                </span>
                            </div>
                            <div className={`${badgePosition === "bottom"
                                ? "text-[10px] pl-8"
                                : badgePosition === "responsive"
                                    ? "text-[10px] pl-8 2xl:pl-0 2xl:px-1.5 2xl:py-0.5"
                                    : "text-[10px] px-1.5 py-0.5"
                                } font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                                {status}
                            </div>
                        </div>

                        {/* Value */}
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className={`text-xl font-bold tabular-nums ${getStatusColor(status)}`}>
                                {value.toFixed(decimals)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {unit}
                            </span>
                            {trend !== undefined && trend !== 0 && (
                                <div className={`ml-auto flex items-center gap-0.5 text-[10px] font-medium ${trend > 0 ? 'text-[#34473d]' : 'text-rose-600'
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

export function RackCard({ rack }: RackCardProps) {
    const daysSince = rack.plantedAt ? Math.floor((new Date().getTime() - new Date(rack.plantedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1 : null;

    const borderColors: Record<string, string> = {
        Critical: "border-rose-200 dark:border-rose-950",
        Warning: "border-amber-200 dark:border-amber-950",
        Normal: "border-gray-200 dark:border-gray-800",
    };

    const statusBadgeColors: Record<string, string> = {
        Critical: "text-rose-500",
        Warning: "text-amber-500",
        Normal: "text-[#34473d]",
    };

    return (
        <Card className={`relative overflow-hidden bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300`}>

            <CardContent className="relative p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-[#50705f] to-[#86a293] border-none text-white shadow-lg mb-6">
                    <h3 className="text-lg font-bold">{rack.label}</h3>
                    {daysSince && (
                        <Badge variant="outline" className="bg-white/20 text-white border-white/20 px-3 py-1 rounded-lg font-bold backdrop-blur-md">
                            Day {daysSince}
                        </Badge>
                    )}
                </div>

                {/* On Rack Section */}
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-2">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        On Rack Sensors
                    </h4>
                    <div className="grid grid-cols-1 gap-3 mt-3">
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
                </div>

                {/* Flow Chart & Alerts */}
                <div className="space-y-3">

                    {/* Water Flow Chart */}
                    <div className="bg-gradient-to-tl from-[#7f9c8c]/40 to-white backdrop-blur-sm rounded-xl p-3 shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <TrendingUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Water Flow</span>
                                <Badge
                                    variant="outline"
                                    className={`px-0 py-0 text-[10px] font-bold border-none ${getStatusColor(rack.waterFlow.status)}`}
                                >
                                    {rack.waterFlow.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold tabular-nums ${getStatusColor(rack.waterFlow.status)}`}>
                                    {rack.waterFlow.value.toFixed(1)} L/min
                                </span>
                            </div>
                        </div>
                        <div className="h-12">
                            <MiniChart
                                data={rack.waterFlow.history}
                                status={rack.waterFlow.status}
                            />
                        </div>
                    </div>
                </div>

                {/* Tank Section - Bento Grid */}
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-2">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        Tank Sensors
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <SensorCard
                            icon={Droplets}
                            label="Water Level"
                            value={rack.waterLevel.value}
                            unit="%"
                            status={rack.waterLevel.status}
                            decimals={0}
                            type="waterLevel"
                            tooltip="Tank water level — Warning: <30%, Critical: <15%"
                            trend={calcTrend(rack.waterLevel)}
                            badgePosition="responsive"
                        />
                        <SensorCard
                            icon={Gauge}
                            label="Water pH Level"
                            value={rack.ph.value}
                            unit="pH"
                            status={rack.ph.status}
                            decimals={2}
                            type="ph"
                            tooltip="Water pH level — optimal for hydroponics: 5.5–6.5"
                            trend={calcTrend(rack.ph)}
                            badgePosition="responsive"
                        />
                        <SensorCard
                            icon={Zap}
                            label="Nutrition"
                            value={rack.ec.value}
                            unit="mS/cm"
                            status={rack.ec.status}
                            decimals={2}
                            type="ec"
                            tooltip="nutrient concentration"
                            trend={calcTrend(rack.ec)}
                            badgePosition="bottom"
                        />
                        <SensorCard
                            icon={Thermometer}
                            label="Water Temp"
                            value={rack.waterTemp.value}
                            unit="°C"
                            status={rack.waterTemp.status}
                            decimals={1}
                            type="waterTemp"
                            tooltip="Water temperature — optimal: 18–28°C"
                            trend={calcTrend(rack.waterTemp)}
                            badgePosition="bottom"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}