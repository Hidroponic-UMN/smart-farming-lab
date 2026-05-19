"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wrench,
  FlaskConical,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  loadCalibration,
  type CalibrationCoefficients,
} from "@/lib/calibration";

// Background Images
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";
import bgBot from "@/assets/images/bgsmartfarmingbot.avif";

export default function CalibrationHubPage() {
  const [calibrations, setCalibrations] = useState<
    Record<number, CalibrationCoefficients | null>
  >({});

  useEffect(() => {
    // Load calibration data for all 5 racks
    const data: Record<number, CalibrationCoefficients | null> = {};
    for (let i = 1; i <= 5; i++) {
      data[i] = loadCalibration(i);
    }
    setCalibrations(data);
  }, []);

  function formatDate(isoString: string | null) {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">Sensor Adjustment</h1>
              <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                Manage and adjust pH & TDS sensors for all racks
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 px-6 py-2 rounded-2xl text-sm font-bold shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            3 Racks Monitoring
          </Badge>
        </div>

        {/* Info Banner - Glass Style */}
        <div className="relative overflow-hidden group bg-white/40 backdrop-blur-md border border-white/20 rounded-[30px] p-8 mb-10 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#50705f] to-[#86a293] text-white shadow-lg">
              <FlaskConical className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#34473d] mb-2">Panduan Sensor Adjustment</h2>
              <p className="text-[#34473d]/80 font-medium leading-relaxed max-w-3xl">
                Adjustment sensor pH dan TDS sangat penting untuk memastikan akurasi pembacaan. 
                Disarankan melakukan adjustment <span className="font-bold text-[#34473d]">setiap 2–4 minggu</span> atau saat sensor baru dipasang. 
                Pilih rak di bawah ini untuk memulai proses adjustment mendetail.
              </p>
            </div>
          </div>
        </div>

        {/* Rack Grid - 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((rackId) => {
            const cal = calibrations[rackId];
            const phCalibrated = cal?.ph_slope != null;
            const tdsCalibrated = cal?.tds_k_factor != null;
            const allCalibrated = phCalibrated && tdsCalibrated;

            return (
              <Card
                key={rackId}
                className={`relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-2 group`}
              >
                <CardContent className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 ${
                        allCalibrated 
                        ? "bg-gradient-to-br from-[#50705f] to-[#86a293] text-white" 
                        : "bg-white/50 text-[#34473d]"
                      }`}>
                        {rackId}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#34473d]">
                          Rack {rackId}
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${allCalibrated ? "text-emerald-600" : "text-orange-500"}`}>
                          {allCalibrated ? "Fully Adjusted" : "Needs Attention"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sensor Status List */}
                  <div className="space-y-3 mb-8">
                    {/* pH Sensor */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <FlaskConical className={`w-4 h-4 ${phCalibrated ? "text-emerald-600" : "text-orange-500"}`} />
                        <span className="text-sm font-bold text-[#34473d]">pH Sensor</span>
                      </div>
                      {phCalibrated ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>

                    {/* TDS Sensor */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/30 border border-white/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <Zap className={`w-4 h-4 ${tdsCalibrated ? "text-emerald-600" : "text-orange-500"}`} />
                        <span className="text-sm font-bold text-[#34473d]">TDS Sensor</span>
                      </div>
                      {tdsCalibrated ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/calibration/${rackId}`} className="block mb-4">
                    <Button
                      variant="outline"
                      className={`w-full h-12 rounded-2xl border-none text-white transition-all font-bold group shadow-lg ${
                        allCalibrated 
                        ? "bg-[#34473d] hover:bg-[#34473d]/90" 
                        : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {allCalibrated ? "Readjust" : "Start Adjustment"}
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  {/* Last Calibrated - Now below the button */}
                  {(cal?.ph_calibrated_at || cal?.tds_calibrated_at) && (
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#34473d]/50 px-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last Adjustment: {formatDate(cal?.ph_calibrated_at || cal?.tds_calibrated_at || null)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
