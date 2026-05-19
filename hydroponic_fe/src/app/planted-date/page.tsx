"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Sprout,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Sparkles,
    CalendarDays,
} from "lucide-react";
import { useRacks } from "@/lib/use-racks";

// Background Images
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";
import bgBot from "@/assets/images/bgsmartfarmingbot.avif";

export default function PlantedDatePage() {
    const { racks, system } = useRacks();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    async function handleSetPlantedDate(rackId: number, date: string) {
        if (!date) return;
        setIsUpdating(rackId.toString());
        try {
            await fetch(`/api/racks/${rackId}/planted-date`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planted_at: new Date(date).toISOString() })
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(null);
        }
    }

    async function handleHarvest(rackId: number) {
        if (!confirm("Apakah Anda yakin ingin memanen rak ini? Tanggal tanam akan direset.")) return;
        setIsUpdating(rackId.toString());
        try {
            await fetch(`/api/racks/${rackId}/planted-date`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planted_at: null })
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(null);
        }
    }

    function calculateDays(plantedAt: string | null) {
        if (!plantedAt) return null;
        return Math.floor((new Date().getTime() - new Date(plantedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    return (
        <div className="min-h-screen w-screen relative overflow-x-hidden flex flex-col font-sans bg-[#f5f4f0]">
            {/* Background Section Bottom */}
            <div
                className="absolute bottom-0 left-0 w-full h-[50vh] bg-cover bg-bottom z-0 opacity-60"
                style={{
                    backgroundImage: `url(${bgBot.src})`,
                    maskImage: 'linear-gradient(to bottom, transparent, black)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)'
                }}
            />

            {/* Background Section Top */}
            <div
                className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center z-0 rounded-b-[30px] overflow-hidden"
                style={{ backgroundImage: `url(${bgTop.src})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col p-6 md:p-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                    <div className="space-y-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 text-[#34473d] hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 rounded-xl">
                                <ArrowLeft className="size-4" />
                                Back to Dashboard
                            </Button>
                        </Link>

                        <div className="pt-2">
                            <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">Planting Management</h1>
                            <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                                Atur tanggal tanam dan kelola siklus panen rak Anda
                            </p>
                        </div>
                    </div>

                    <Badge
                        variant="outline"
                        className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 px-6 py-2 rounded-2xl text-sm font-bold shadow-lg"
                    >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {Math.min(racks?.length || 0, 3)} Racks Total
                    </Badge>
                </div>

                {/* Info Banner */}
                <div className="relative overflow-hidden group bg-white/40 backdrop-blur-md border border-white/20 rounded-[30px] p-8 mb-10 shadow-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white shadow-lg">
                            <Sprout className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-[#34473d] mb-2">Manajemen Siklus Tanam</h2>
                            <p className="text-[#34473d]/80 font-medium leading-relaxed max-w-3xl">
                                Gunakan halaman ini untuk mencatat kapan Anda mulai menanam di setiap rak. 
                                Sistem akan otomatis menghitung usia tanaman (Day X). Klik <span className="font-bold text-[#34473d]">Panen</span> untuk mereset siklus setelah selesai.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rack Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {racks?.slice(0, 3).map((rack) => {
                        const days = calculateDays(rack.plantedAt);
                        const isThisUpdating = isUpdating === rack.id.toString();

                        return (
                            <Card
                                key={rack.id}
                                className={`relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-1`}
                            >
                                <CardContent className="p-6">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 ${rack.plantedAt
                                                    ? "bg-gradient-to-br from-[#50705f] to-[#86a293] text-white"
                                                    : "bg-white/50 text-[#34473d]"
                                                }`}>
                                                {rack.id}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-[#34473d]">
                                                    {rack.label}
                                                </h3>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${rack.plantedAt ? "text-emerald-600" : "text-gray-400"}`}>
                                                    {rack.plantedAt ? `Growing - Day ${days}` : "Empty Rack"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Info */}
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between py-4 px-5 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Planted At</span>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className={`w-4 h-4 ${rack.plantedAt ? "text-[#50705f]" : "text-gray-300"}`} />
                                                    <span className="text-sm font-bold text-[#34473d]">
                                                        {rack.plantedAt 
                                                            ? new Date(rack.plantedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
                                                            : "Belum diset"
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            {rack.plantedAt ? (
                                                <Badge className="bg-[#50705f]/10 text-[#50705f] border-none font-bold">
                                                    Day {days}
                                                </Badge>
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3">
                                        {!rack.plantedAt ? (
                                            <div className="relative group">
                                                <Button
                                                    disabled={isThisUpdating}
                                                    className="w-full h-12 rounded-2xl bg-[#34473d] hover:bg-[#34473d]/90 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    Set Tanggal Tanam
                                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                                </Button>
                                                <input
                                                    type="date"
                                                    disabled={isThisUpdating}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    onChange={(e) => handleSetPlantedDate(rack.id, e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleHarvest(rack.id)}
                                                disabled={isThisUpdating}
                                                className="w-full h-12 rounded-2xl bg-[#50705f] hover:bg-[#3a5245] text-white font-bold shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Sprout className="w-4 h-4" />
                                                Panen Sekarang
                                                <ChevronRight className="w-4 h-4 ml-auto" />
                                            </Button>
                                        )}
                                        
                                        {rack.plantedAt && (
                                            <div className="relative">
                                                <Button
                                                    variant="outline"
                                                    disabled={isThisUpdating}
                                                    className="w-full h-10 rounded-xl border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 text-xs font-semibold"
                                                >
                                                    Ubah Tanggal
                                                </Button>
                                                <input
                                                    type="date"
                                                    disabled={isThisUpdating}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    onChange={(e) => handleSetPlantedDate(rack.id, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
