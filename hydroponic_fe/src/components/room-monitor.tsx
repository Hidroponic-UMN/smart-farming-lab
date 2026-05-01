"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorData } from "@/lib/sensor-data";
import { getStatusBg, getStatusColor, THRESHOLDS } from "@/lib/thresholds";
import { Thermometer, Droplets } from "lucide-react";
import { MiniChart } from "./mini-chart";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomMonitorProps {
    temperature: SensorData;
    humidity: SensorData;
}

function RoomSensor({
    sensor,
    type,
    icon: Icon,
    variant = "default",
}: {
    sensor: SensorData;
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    variant?: "default" | "inverted";
}) {
    const config = THRESHOLDS[type];
    const isInverted = variant === "inverted";

    return (
        <Card className={`py-4 px-5 h-full transition-all duration-300 border border-white/20 backdrop-blur-md shadow-lg ${
            sensor.status !== "Normal"
                ? `${getStatusBg(sensor.status)} ${getStatusColor(sensor.status)}`
                : type === "roomTemp"
                    ? "bg-gradient-to-br from-[#50705f] to-[#86a293] text-white" 
                    : "bg-white/30 text-[#34473d]"
            }`}>
            <CardContent className="p-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${type === "roomTemp" ? "bg-white/20" : "bg-[#34473d]/10"}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80 leading-none mb-1.5">
                                {config.label}
                            </p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold leading-none tracking-tight">
                                    {sensor.value.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium opacity-70">
                                    {config.unit}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`hidden md:inline-flex text-[11px] font-bold uppercase tracking-widest border-none p-0 px-2 py-0.5 rounded-full ${
                            type === "roomTemp" ? "bg-white/10 text-white" : "bg-[#34473d]/10 text-[#34473d]"
                        }`}
                    >
                        {sensor.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

export function RoomMonitor({ temperature, humidity }: RoomMonitorProps) {
    return (
        <div className="grid grid-cols-2 gap-3 h-full">
            <RoomSensor sensor={temperature} type="roomTemp" icon={Thermometer} variant="inverted" />
            <RoomSensor sensor={humidity} type="roomHumidity" icon={Droplets} />
        </div>
    );
}
