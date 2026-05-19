"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FlaskConical,
  Zap,
  CheckCircle2,
  Wrench,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PhCalibrationSteps } from "@/components/calibration/ph-calibration-steps";
import { TdsCalibrationSteps } from "@/components/calibration/tds-calibration-steps";

// Background Image
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";

export const dynamic = "force-dynamic";

type CalibrationMode = "select" | "ph" | "tds";

export default function RackCalibrationPage() {
  const params = useParams();
  const router = useRouter();
  const rackId = parseInt(params.rackId as string);

  const [mode, setMode] = useState<CalibrationMode>("select");
  const [phDone, setPhDone] = useState(false);
  const [tdsDone, setTdsDone] = useState(false);

  if (mode === "ph") {
    return (
      <div className="min-h-screen bg-[#f5f4f0] text-foreground flex flex-col">
        <PhCalibrationSteps
          rackId={rackId}
          onComplete={() => {
            setPhDone(true);
            setMode("select");
          }}
          onCancel={() => setMode("select")}
        />
      </div>
    );
  }

  if (mode === "tds") {
    return (
      <div className="min-h-screen bg-[#f5f4f0] text-foreground flex flex-col">
        <TdsCalibrationSteps
          rackId={rackId}
          onComplete={() => {
            setTdsDone(true);
            setMode("select");
          }}
          onCancel={() => setMode("select")}
        />
      </div>
    );
  }

  // Mode === "select"
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
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div className="space-y-4">
            <Link href="/calibration">
              <Button variant="ghost" size="sm" className="gap-2 text-[#34473d] hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 rounded-xl">
                <ArrowLeft className="size-4" />
                All Racks
              </Button>
            </Link>
            
            <div className="pt-2">
              <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">Rack {rackId} Adjustment</h1>
              <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                Pilih sensor yang ingin Anda sesuaikan pada rak ini
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="bg-white/40 backdrop-blur-md text-[#34473d] border-white/40 px-6 py-2 rounded-2xl text-sm font-bold shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Active Adjustment Mode
          </Badge>
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {/* Sensor Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* pH Card */}
            <button
              onClick={() => setMode("ph")}
              className="group relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 rounded-[32px] p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/60"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold text-[#34473d] group-hover:translate-x-1 transition-transform">
                    pH Sensor
                  </h3>
                  {phDone && (
                    <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full shadow-lg text-[10px]">
                      DONE
                    </Badge>
                  )}
                </div>
                <p className="text-[#34473d]/70 font-medium mb-6 leading-relaxed">
                  Adjustment 2 titik menggunakan larutan buffer pH 7.0 dan pH 4.0. 
                  Penting untuk akurasi nutrisi tanaman.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 rounded-lg bg-white/40 text-[10px] font-bold text-[#34473d] uppercase tracking-wider">2-Point Adj</span>
                  <span className="px-3 py-1 rounded-lg bg-white/40 text-[10px] font-bold text-[#34473d] uppercase tracking-wider">~5 Mins</span>
                </div>

                <div className="flex items-center text-[#34473d] font-bold group-hover:gap-3 gap-2 transition-all">
                  Select pH Adjustment <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* TDS Card */}
            <button
              onClick={() => setMode("tds")}
              className="group relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/20 rounded-[32px] p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/60"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold text-[#34473d] group-hover:translate-x-1 transition-transform">
                    TDS Sensor
                  </h3>
                  {tdsDone && (
                    <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full shadow-lg text-[10px]">
                      DONE
                    </Badge>
                  )}
                </div>
                <p className="text-[#34473d]/70 font-medium mb-6 leading-relaxed">
                  Adjustment 1 titik dengan larutan referensi 1382 ppm. 
                  Memastikan konsentrasi mineral air terkontrol.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 rounded-lg bg-white/40 text-[10px] font-bold text-[#34473d] uppercase tracking-wider">1-Point Adj</span>
                  <span className="px-3 py-1 rounded-lg bg-white/40 text-[10px] font-bold text-[#34473d] uppercase tracking-wider">~3 Mins</span>
                </div>

                <div className="flex items-center text-[#34473d] font-bold group-hover:gap-3 gap-2 transition-all">
                  Select TDS Adjustment <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>

          {/* Success message if both done */}
          {phDone && tdsDone && (
            <div className="mt-12 group relative overflow-hidden bg-gradient-to-br from-[#50705f] to-[#34473d] rounded-[40px] p-10 text-center shadow-2xl border border-white/10">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  Adjustment Complete! 🎉
                </h3>
                <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
                  Semua sensor pada Rack {rackId} telah berhasil disesuaikan. 
                  Dashboard akan menampilkan nilai yang telah di-adjust.
                </p>
                <Link href="/">
                  <Button className="h-14 px-10 rounded-2xl bg-white text-[#34473d] hover:bg-white/90 font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
              {/* Decorative background circle */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
