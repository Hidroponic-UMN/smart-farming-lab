"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Wifi,
    WifiOff,
    Server,
    ServerOff,
    Activity,
    Sun,
    Moon,
    Leaf,
    ChevronUp,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Minus,
    Wrench,
    History,
} from "lucide-react";
import type { SystemStatus } from "@/lib/sensor-data";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationCenter } from "@/components/notification-center";
import type { Notification } from "@/lib/notifications";

/** Renders time only on client to avoid SSR hydration mismatch */
function ClientTime({ date }: { date: Date }) {
    const [timeStr, setTimeStr] = useState("—");
    useEffect(() => {
        setTimeStr(date.toLocaleTimeString());
    }, [date]);
    return <>{timeStr}</>;
}

interface HeaderProps {
    system: SystemStatus;
    warningCount: number;
    criticalCount: number;
    notifications: Notification[];
    unreadCount: number;
    onMarkAllRead: () => void;
    onClearAll: () => void;
}

export function Header({
    system,
    warningCount,
    criticalCount,
    notifications,
    unreadCount,
    onMarkAllRead,
    onClearAll,
}: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);



    return (
        <header className="mx-4 mb-3 rounded-2xl border border-gray-700 dark:border-border bg-gray-900 text-gray-100 dark:bg-card/80 dark:text-foreground backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out z-10">
            <div className={`relative flex items-center justify-between px-5 transition-all duration-300 ease-in-out ${collapsed ? "py-1.5" : "py-2.5"}`}>

                {/* Center: Status badges — always visible */}
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 dark:bg-muted/50">
                                {system.esp32Online ? (
                                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                    <WifiOff className="w-3.5 h-3.5 text-red-500" />
                                )}
                                {!collapsed && <span className="text-[11px] font-medium">ESP32</span>}
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${system.esp32Online ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                                        }`}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            ESP32 Controller: {system.esp32Online ? "Connected" : "Disconnected"}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 dark:bg-muted/50">
                                {system.serverOnline ? (
                                    <Server className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                    <ServerOff className="w-3.5 h-3.5 text-red-500" />
                                )}
                                {!collapsed && <span className="text-[11px] font-medium">Server</span>}
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${system.serverOnline
                                        ? "bg-emerald-500"
                                        : "bg-red-500 animate-pulse"
                                        }`}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            Server: {system.serverOnline ? "Online" : "Offline"}
                        </TooltipContent>
                    </Tooltip>

                    {warningCount > 0 && (
                        <Badge
                            variant="outline"
                            className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[11px] font-medium"
                        >
                            {warningCount} Warning
                        </Badge>
                    )}
                    {criticalCount > 0 && (
                        <Badge
                            variant="outline"
                            className="bg-red-500/15 text-red-500 border-red-500/30 text-[11px] font-medium animate-pulse"
                        >
                            {criticalCount} Critical
                        </Badge>
                    )}
                </div>

                {/* Title — absolute center */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <h1 className={`font-semibold tracking-tight leading-tight transition-all duration-300 ${collapsed ? "text-sm" : "text-base"}`}>
                        Lab Smart Farming
                    </h1>
                    {!collapsed && (
                        <p className="text-[11px] text-gray-400 dark:text-muted-foreground leading-tight">
                            C502
                        </p>
                    )}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-4">
                    {!collapsed && (
                        <div className="text-right mr-2">
                            <span className="text-[10px] text-gray-400 dark:text-muted-foreground block leading-tight">
                                Last Updated
                            </span>
                            <span className="text-[11px] font-mono font-medium leading-tight">
                                <ClientTime date={system.lastUpdated} />
                            </span>
                        </div>
                    )}



                    <NotificationCenter
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={onMarkAllRead}
                        onClearAll={onClearAll}
                        collapsed={collapsed}
                    />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/history">
                                <button
                                    className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 dark:bg-muted/50 hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor History</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/calibration">
                                <button
                                    className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 dark:bg-muted/50 hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors"
                                >
                                    <Wrench className="w-4 h-4" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor Calibration</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 dark:bg-muted/50 hover:bg-gray-700 dark:hover:bg-muted transition-colors"
                            >
                                {theme === "dark" ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle theme</TooltipContent>
                    </Tooltip>

                    {/* Collapse toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-800 dark:bg-muted/50 hover:bg-gray-700 dark:hover:bg-muted transition-colors"
                            >
                                {collapsed ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{collapsed ? "Expand header" : "Collapse header"}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
}
