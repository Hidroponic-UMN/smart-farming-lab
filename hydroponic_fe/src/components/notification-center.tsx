"use client";

import { useState } from "react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Bell,
    CheckCheck,
    Trash2,
} from "lucide-react";
import type { Notification } from "@/lib/notifications";

const SENSOR_LABELS: Record<string, string> = {
    lightIntensity: "Light",
    ph: "Water pH Level",
    ec: "Nutrition",
    waterLevel: "Water Level",
    waterTemp: "Water Temp",
    waterFlow: "Water Flow",
};

interface NotificationCenterProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAllRead: () => void;
    onClearAll: () => void;
    collapsed?: boolean;
}

function formatTime(date: Date) {
    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function NotificationCenter({
    notifications,
    unreadCount,
    onMarkAllRead,
    onClearAll,
    collapsed = false,
}: NotificationCenterProps) {
    const [open, setOpen] = useState(false);

    return (
        <Drawer direction="right" open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DrawerTrigger asChild>
                        <button
                            className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group"
                        >
                            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none border-2 border-background">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </DrawerTrigger>
                </TooltipTrigger>
                <TooltipContent>Pusat Notifikasi</TooltipContent>
            </Tooltip>

            <DrawerContent className="h-full bg-[#f5f4f0]/95 backdrop-blur-xl border-l border-white/30 shadow-2xl">
                <div className="flex flex-col h-full w-full">
                    <DrawerHeader className="pb-6 border-b border-white/20 px-6 pt-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <DrawerTitle className="text-xl font-bold text-[#34473d] tracking-tight">
                                    Pusat Notifikasi ({notifications.length})
                                </DrawerTitle>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={onMarkAllRead}
                                                className="flex items-center justify-center w-8 h-8 text-[#34473d] hover:opacity-70 transition-all"
                                            >
                                                <CheckCheck className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Tandai dibaca</TooltipContent>
                                    </Tooltip>
                                )}
                                {notifications.length > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={onClearAll}
                                                className="flex items-center justify-center w-8 h-8 text-[#8c0000] hover:opacity-70 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Hapus semua</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </DrawerHeader>

                    {/* Notification List */}
                    <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-white/40 flex items-center justify-center mb-6 shadow-inner">
                                    <Bell className="w-6 h-6 text-[#34473d]/20" />
                                </div>
                                <h3 className="text-base font-bold text-[#34473d] mb-1">Semua Terkendali</h3>
                                <p className="text-xs text-[#34473d]/60 max-w-[200px]">
                                    Belum ada aktivitas sensor yang memerlukan perhatian khusus.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notif, index) => (
                                    <div
                                        key={notif.id}
                                        className={`relative rounded-2xl p-4 transition-all duration-300 ${index < unreadCount
                                            ? "bg-white/60 shadow-md border border-white/60"
                                            : "bg-white/20 border border-white/20 opacity-70"
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            {/* Top Content */}
                                            <div className="flex gap-4 items-center">
                                                {/* Left: Rack Label Box */}
                                                <div className="w-16 h-10 rounded-xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm px-2 text-center leading-tight">
                                                    {notif.rackLabel}
                                                </div>

                                                {/* Right: Data Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Top Line */}
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#34473d]">
                                                            {SENSOR_LABELS[notif.sensorType] || notif.sensorLabel}
                                                        </span>
                                                        <span className="text-[10px] text-[#34473d]/40 font-bold tabular-nums shrink-0 ml-2">
                                                            {formatTime(notif.timestamp)}
                                                        </span>
                                                    </div>

                                                    {/* Bottom Line (Data) */}
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${notif.status === 'Critical' ? 'text-rose-600' : 'text-[#f8650c]'}`}>
                                                            {notif.status}
                                                        </span>
                                                        <span className="text-xs font-bold text-[#34473d] tabular-nums">
                                                            {notif.value.toFixed(notif.sensorType === "ph" || notif.sensorType === "ec" ? 2 : notif.sensorType === "lightIntensity" || notif.sensorType === "waterLevel" ? 0 : 1)}
                                                            <span className="ml-0.5 text-[9px] font-medium opacity-50 uppercase">{notif.unit}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Content */}
                                            <div className="h-[1px] bg-[#34473d]/10 w-full my-3" />
                                            <p className="text-[11px] leading-relaxed text-[#34473d]/80 px-1">
                                                {notif.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
