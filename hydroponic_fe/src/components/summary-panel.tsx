"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RackData } from "@/lib/simulation";
import { CheckCircle2, AlertTriangle, AlertOctagon, Layers } from "lucide-react";

interface SummaryPanelProps {
    racks: RackData[];
}

function getStatusDotClass(status: string): string {
    if (status === "Critical") return "bg-red-500 animate-pulse";
    if (status === "Warning" || status === "Low" || status === "High") return "bg-amber-500";
    return "bg-emerald-500";
}

export function SummaryPanel({ racks }: SummaryPanelProps) {
    const total = racks.length;
    const normal = racks.filter((r) => r.overallStatus === "Normal").length;
    const warning = racks.filter(
        (r) =>
            r.overallStatus === "Warning" ||
            r.overallStatus === "Low" ||
            r.overallStatus === "High"
    ).length;
    const critical = racks.filter((r) => r.overallStatus === "Critical").length;

    // Collect active alerts
    const alerts: { rack: string; sensor: string; status: string }[] = [];
    for (const rack of racks) {
        const sensors = [
            { name: "Water Level", data: rack.waterLevel },
            { name: "pH", data: rack.ph },
            { name: "Nutrition", data: rack.ec },
            { name: "Water Temp", data: rack.waterTemp },
            { name: "Water Flow", data: rack.waterFlow },
            { name: "Light", data: rack.lightIntensity },
        ];
        for (const sensor of sensors) {
            if (sensor.data.status === "Critical") {
                alerts.push({
                    rack: rack.label,
                    sensor: sensor.name,
                    status: sensor.data.status,
                });
            }
        }
    }

    return (
        <div className="flex flex-col gap-2.5 h-full">

            {/* Rack Indicators */}
            <div className="flex items-center justify-between gap-4 mb-2">
                {racks.map((rack, index) => (
                    <div
                        className="flex items-center gap-5 px-3 py-2.5 rounded-lg bg-gradient-to-br from-[#50705f] to-[#86a293] text-white" // adjust disini (gradient warna)
                        key={`rack-${rack.id ?? index}`}
                    >
                        <span
                            className={`w-2.5 h-2.5 rounded-full border border-white/20 ${getStatusDotClass(rack.overallStatus)}`}
                        />
                        <span className="text-sm font-medium">
                            {rack.label}
                        </span>
                        <span className={`text-xs font-bold ${rack.overallStatus === "Critical"
                            ? "text-red-200"
                            : rack.overallStatus === "Warning"
                                ? "text-amber-200"
                                : "text-emerald-200"
                            }`}>
                            {rack.overallStatus}
                        </span>
                    </div>
                ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-2.5">
                <Card className="bg-card/60 border-border/50 py-3.5 gap-0">
                    <CardContent className="px-3 py-0 flex items-center gap-2.5">
                        <Layers className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-tight">
                                Total
                            </p>
                            <p className="text-xl font-bold leading-tight">{total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50 py-2.5 gap-0">
                    <CardContent className="px-3 py-0 flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-tight">
                                Normal
                            </p>
                            <p className="text-xl font-bold leading-tight text-emerald-500">
                                {normal}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50 py-2.5 gap-0">
                    <CardContent className="px-3 py-0 flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-tight">
                                Warning
                            </p>
                            <p className="text-xl font-bold leading-tight text-amber-500">
                                {warning}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50 py-2.5 gap-0">
                    <CardContent className="px-3 py-0 flex items-center gap-2.5">
                        <AlertOctagon className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-tight">
                                Critical
                            </p>
                            <p className="text-xl font-bold leading-tight text-red-500">
                                {critical}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active alerts */}
            {alerts.length > 0 && (
                <Card className="bg-red-500/5 border-red-500/20 py-2.5 gap-0 flex-1 min-h-0">
                    <CardContent className="px-3 py-0">
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                                Active Alerts
                            </span>
                        </div>
                        <div className="space-y-1 overflow-hidden">
                            {alerts.slice(0, 5).map((alert, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <AlertOctagon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                    <span className="text-red-400 font-medium">
                                        {alert.rack}
                                    </span>
                                    <span className="text-muted-foreground">—</span>
                                    <span className="text-foreground">{alert.sensor}</span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-0 py-0 font-bold border-none text-red-500 ml-auto"
                                    >
                                        {alert.status}
                                    </Badge>
                                </div>
                            ))}
                            {alerts.length > 5 && (
                                <p className="text-xs text-muted-foreground">
                                    +{alerts.length - 5} more alerts
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}


        </div>
    );
}
