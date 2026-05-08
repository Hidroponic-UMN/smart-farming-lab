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
    LayoutGrid,
    List,
    Settings,
    TrendingUp,
    TrendingDown,
    Activity,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useSimulationContext, type SimulationMode } from "@/lib/simulation-context";
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
import type { SystemStatus } from "@/lib/sensor-data";

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
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
    onMarkAllRead: () => void;
    onClearAll: () => void;
}

export function TopNavbar({
    system,
    warningCount,
    criticalCount,
    notifications,
    unreadCount,
    viewMode,
    onViewModeChange,
    onMarkAllRead,
    onClearAll,
}: TopNavbarProps) {
    const { isSimulating, toggleSimulation, simulationMode, setSimulationMode } = useSimulationContext();

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

                {/* Group 2: View Toggles & Actions */}
                <div className="flex items-center gap-2">

                    {/* Grid/List Toggle */}
                    <div className="flex items-center bg-white/20 backdrop-blur-md p-1 rounded-xl border border-white/20 mr-2 shadow-sm">
                        <button
                            onClick={() => onViewModeChange("grid")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-[#34473d] text-white shadow-md" : "text-[#34473d]/50 hover:text-[#34473d]"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewModeChange("list")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-[#34473d] text-white shadow-md" : "text-[#34473d]/50 hover:text-[#34473d]"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

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

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <button className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/20 active:scale-95 ${isSimulating ? 'bg-[#50705f]/20 text-[#50705f]' : 'text-[#34473d]'}`}>
                                        <Settings className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Setting</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-xl border-white/20 shadow-xl rounded-xl p-2">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Simulate Data</span>
                                <Switch checked={isSimulating} onCheckedChange={toggleSimulation} />
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-100" />
                            <div className="flex items-center justify-between mt-2 px-1 gap-2">
                                <button
                                    disabled={!isSimulating}
                                    onClick={() => setSimulationMode("stable")}
                                    className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-colors ${!isSimulating ? 'opacity-50 cursor-not-allowed' : simulationMode === 'stable' ? 'bg-[#34473d] text-white' : 'hover:bg-gray-100'}`}
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={!isSimulating}
                                    onClick={() => setSimulationMode("trending_up")}
                                    className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-colors ${!isSimulating ? 'opacity-50 cursor-not-allowed' : simulationMode === 'trending_up' ? 'bg-rose-500 text-white' : 'hover:bg-rose-50 text-rose-500'}`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={!isSimulating}
                                    onClick={() => setSimulationMode("trending_down")}
                                    className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-colors ${!isSimulating ? 'opacity-50 cursor-not-allowed' : simulationMode === 'trending_down' ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-blue-500'}`}
                                >
                                    <TrendingDown className="w-4 h-4" />
                                </button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

                                    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[#34473d] flex items-center gap-2"><Settings className="w-4 h-4" /> Simulation</span>
                                            <Switch checked={isSimulating} onCheckedChange={toggleSimulation} />
                                        </div>
                                        {isSimulating && (
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                                                <button onClick={() => setSimulationMode("stable")} className={`flex-1 py-2 rounded-lg flex justify-center transition-colors ${simulationMode === 'stable' ? 'bg-[#34473d] text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}><Activity className="w-4 h-4" /></button>
                                                <button onClick={() => setSimulationMode("trending_up")} className={`flex-1 py-2 rounded-lg flex justify-center transition-colors ${simulationMode === 'trending_up' ? 'bg-rose-500 text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-500'}`}><TrendingUp className="w-4 h-4" /></button>
                                                <button onClick={() => setSimulationMode("trending_down")} className={`flex-1 py-2 rounded-lg flex justify-center transition-colors ${simulationMode === 'trending_down' ? 'bg-blue-500 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-500'}`}><TrendingDown className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}
