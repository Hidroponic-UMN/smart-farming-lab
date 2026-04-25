"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Wrench,
    History,
    Wifi,
    WifiOff,
    Server,
    ServerOff,
    Menu,
    Activity,
} from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
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

    return (
        <div className="flex items-center justify-end w-full">
            {/* Desktop & Tablet Menu */}
            <div className="hidden md:flex flex-col lg:flex-row items-end lg:items-center gap-4 lg:gap-8">
                
                {/* Group 1: System Status (ESP32, Server, Last Sync) */}
                <div className="flex items-center gap-6 lg:border-r lg:border-white/20 lg:pr-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                {system.esp32Online ? (
                                    <Wifi className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <WifiOff className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34473d]/70">ESP32</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>ESP32 Controller: {system.esp32Online ? "Connected" : "Disconnected"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                {system.serverOnline ? (
                                    <Server className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <ServerOff className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34473d]/70">Server</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Server: {system.serverOnline ? "Online" : "Offline"}</TooltipContent>
                    </Tooltip>

                    <div className="flex flex-col items-end min-w-[70px]">
                        <span className="text-[9px] font-bold text-[#34473d]/50 uppercase tracking-widest leading-none mb-1">Last Sync</span>
                        <span className="text-[11px] font-mono font-bold leading-none text-[#34473d]">
                            <ClientTime date={system.lastUpdated} />
                        </span>
                    </div>
                </div>

                {/* Group 2: Action Buttons */}
                <div className="flex items-center gap-2">
                    <NotificationCenter
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={onMarkAllRead}
                        onClearAll={onClearAll}
                    />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/history">
                                <button className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/20 active:scale-95">
                                    <History className="w-5 h-5 text-[#34473d]" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor History</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/calibration">
                                <button className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/20 active:scale-95">
                                    <Wrench className="w-5 h-5 text-[#34473d]" />
                                </button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Sensor Calibration</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
                <Drawer direction="right">
                    <DrawerTrigger asChild>
                        <button className="p-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg active:scale-95 transition-all">
                            <Menu className="w-6 h-6 text-[#34473d]" />
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="h-full mt-0 rounded-none border-l border-white/20 bg-white/90 backdrop-blur-xl">
                        <div className="p-6 pt-12 space-y-8">
                            {/* Mobile Status Group */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">System Status</h4>
                                <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {system.esp32Online ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                                            <span className="text-sm font-medium text-[#34473d]">ESP32 Controller</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {system.serverOnline ? <Server className="w-4 h-4 text-emerald-600" /> : <ServerOff className="w-4 h-4 text-red-500" />}
                                            <span className="text-sm font-medium text-[#34473d]">Backend Server</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-bold uppercase">Last Sync</span>
                                        <span className="font-mono font-bold text-[#34473d]"><ClientTime date={system.lastUpdated} /></span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Quick Actions */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Quick Actions</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <span className="font-semibold text-[#34473d]">Notifications</span>
                                        <div className="flex items-center gap-3">
                                            <NotificationCenter
                                                notifications={notifications}
                                                unreadCount={unreadCount}
                                                onMarkAllRead={onMarkAllRead}
                                                onClearAll={onClearAll}
                                            />
                                        </div>
                                    </div>

                                    <Link href="/history" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
                                        <span className="font-semibold text-[#34473d]">History Log</span>
                                        <History className="w-5 h-5 text-black" />
                                    </Link>

                                    <Link href="/calibration" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
                                        <span className="font-semibold text-[#34473d]">Calibration</span>
                                        <Wrench className="w-5 h-5 text-black" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}
