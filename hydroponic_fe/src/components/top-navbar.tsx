"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
    Sun,
    Moon,
    Wrench,
    History,
    Wifi,
    WifiOff,
    Server,
    ServerOff,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationCenter } from "@/components/notification-center";
import type { Notification } from "@/lib/notifications";
import type { SystemStatus } from "@/lib/simulation";

/** Renders time only on client to avoid SSR hydration mismatch */
function ClientTime({ date }: { date: Date }) {
    const [timeStr, setTimeStr] = useState("—");
    useEffect(() => {
        setTimeStr(date.toLocaleTimeString());
    }, [date]);
    return <>{timeStr}</>;
}

interface TopNavbarProps {
    system: SystemStatus;
    warningCount: number;
    criticalCount: number;
    notifications: Notification[];
    unreadCount: number;
    onMarkAllRead: () => void;
    onClearAll: () => void;
}

export function TopNavbar({
    system,
    warningCount,
    criticalCount,
    notifications,
    unreadCount,
    onMarkAllRead,
    onClearAll,
}: TopNavbarProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center justify-end w-full">
            {/* Left side is now empty in TopNavbar, moved to page.tsx */}

            {/* Right: Status & Action Icons */}
            <div className="flex items-center gap-8">
                
                {/* Group 1: System Status (ESP32, Server, Last Sync) */}
                <div className="flex items-center gap-6 pr-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                {system.esp32Online ? (
                                    <Wifi className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <WifiOff className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ESP32</span>
                                <span className={`w-2 h-2 rounded-full ${system.esp32Online ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>ESP32 Controller: {system.esp32Online ? "Connected" : "Disconnected"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                {system.serverOnline ? (
                                    <Server className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <ServerOff className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Server</span>
                                <span className={`w-2 h-2 rounded-full ${system.serverOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Server: {system.serverOnline ? "Online" : "Offline"}</TooltipContent>
                    </Tooltip>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Last Sync</span>
                        <span className="text-xs font-mono font-bold leading-none text-foreground">
                            <ClientTime date={system.lastUpdated} />
                        </span>
                    </div>
                </div>

                {/* Group 2: Action Buttons */}
                <div className="flex items-center gap-3">
                    <NotificationCenter
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={onMarkAllRead}
                        onClearAll={onClearAll}
                    />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/history">
                                <button className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group">
                                    <History className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor History</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/calibration">
                                <button className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group">
                                    <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor Calibration</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group"
                            >
                                {theme === "dark" ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle Theme</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
