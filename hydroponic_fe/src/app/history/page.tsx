"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Activity,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Download,
} from "lucide-react";
import { useRacks } from "@/lib/use-racks";

// Background Images
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";
import bgBot from "@/assets/images/bgsmartfarmingbot.avif";

export default function HistoryHubPage() {
  const { racks, system } = useRacks();
  const displayRacks = racks || [];

  function formatDate(date: Date | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen w-screen relative overflow-x-hidden flex flex-col font-sans bg-[#f5f4f0]">
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
              <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">Sensor History</h1>
              <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                Arsip data dan grafik log sensor setiap rak
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <Badge
              variant="outline"
              className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 px-6 py-2 rounded-2xl text-sm font-bold shadow-lg w-fit"
            >
              <Calendar className="w-4 h-4 mr-2" />
              System Logging Active
            </Badge>
            <a href="/api/export/csv" target="_blank" rel="noreferrer">
              <Button variant="outline" className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 rounded-xl font-bold shadow-md hover:bg-white/60 hover:text-[#50705f] transition-colors w-fit">
                <Download className="w-4 h-4 mr-2" />
                Export All Data (CSV)
              </Button>
            </a>
          </div>
        </div>

        {/* Room Monitor Card */}
        <div className="mb-6">
          <Card
            className="relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-2 group"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white flex items-center justify-center font-bold text-lg shadow-lg border border-white/20">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#34473d]">
                      Room Monitor
                    </h3>
                    <p className="text-xs font-semibold text-[#34473d]/60 uppercase tracking-widest">
                      Suhu & Kelembaban Ruangan
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-[#34473d]" />
                    <span className="text-sm font-bold text-[#34473d]">
                      Sensors
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34473d]/70">
                    Temperature, Humidity
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[#34473d]" />
                    <span className="text-sm font-bold text-[#34473d]">
                      Last Sync
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34473d]/70">
                    {formatDate(system.lastUpdated)}
                  </span>
                </div>
              </div>

              <Link href="/rack/0" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl bg-[#34473d] text-white border-none hover:bg-[#34473d]/90 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
                >
                  View Room History
                  <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Rack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((rackNum) => {
            const deviceId = rackNum + 1; // Rack 1 = device 2, Rack 2 = device 3, Rack 3 = device 4
            const rack = displayRacks.find(r => r.id === rackNum);

            return (
              <Card
                key={rackNum}
                className="relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <CardContent className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20">
                        {rackNum}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#34473d]">
                          Rack {rackNum}
                        </h3>
                        <p className="text-xs font-semibold text-[#34473d]/60 uppercase tracking-widest">
                          {rack ? "Active Log" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info list */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-4 h-4 text-[#34473d]" />
                        <span className="text-sm font-bold text-[#34473d]">
                          Samples
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#34473d]/70">
                        {rack ? "2.4k pts" : "0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-[#34473d]" />
                        <span className="text-sm font-bold text-[#34473d]">
                          Last Sync
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#34473d]/70">
                        {formatDate(system.lastUpdated)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/rack/${rackNum}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl bg-[#34473d] text-white border-none hover:bg-[#34473d]/90 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
                    >
                      View Detailed Charts
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
