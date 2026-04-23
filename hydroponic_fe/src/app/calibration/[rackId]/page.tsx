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
} from "lucide-react";
import { PhCalibrationSteps } from "@/components/calibration/ph-calibration-steps";
import { TdsCalibrationSteps } from "@/components/calibration/tds-calibration-steps";

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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/calibration">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="size-4" />
                All Racks
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Wrench className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-lg font-bold">Rack {rackId} — Kalibrasi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
            <Wrench className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Pilih Sensor untuk Dikalibrasi
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Kalibrasi sensor pH dan TDS pada Rack {rackId}. Anda bisa
            mengkalibrasi masing-masing sensor secara terpisah.
          </p>
        </div>

        {/* Sensor Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* pH Card */}
          <button
            onClick={() => setMode("ph")}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-6 text-left
                       hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1
                       transition-all duration-300"
          >
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

            <div className="relative">
              {/* Icon */}
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <FlaskConical className="w-7 h-7 text-emerald-500" />
                </div>
                {phDone && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Done!
                  </Badge>
                )}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
                pH Sensor
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Kalibrasi 2 titik menggunakan larutan buffer pH 7.0 dan pH 4.0.
                Menghasilkan koefisien slope dan offset untuk konversi linear.
              </p>

              {/* Details */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  2-point calibration
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  ~5 menit
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Buffer pH 7.0 & 4.0
                </Badge>
              </div>
            </div>
          </button>

          {/* TDS Card */}
          <button
            onClick={() => setMode("tds")}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-6 text-left
                       hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1
                       transition-all duration-300"
          >
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />

            <div className="relative">
              {/* Icon */}
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Zap className="w-7 h-7 text-blue-500" />
                </div>
                {tdsDone && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Done!
                  </Badge>
                )}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-500 transition-colors">
                TDS Sensor
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Kalibrasi 1 titik dengan larutan referensi 1382 ppm. Celupkan
                sensor TDS dan suhu bersamaan — ESP32 auto-kompensasi suhu.
              </p>

              {/* Details */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  1-point calibration
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  ~3 menit
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  1382 ppm + auto suhu
                </Badge>
              </div>
            </div>
          </button>
        </div>

        {/* Success message if both done */}
        {phDone && tdsDone && (
          <div className="mt-8 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-500 mb-1">
              Kalibrasi Selesai! 🎉
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kedua sensor pada Rack {rackId} telah berhasil dikalibrasi.
              Dashboard akan menampilkan nilai yang telah dikalibrasi.
            </p>
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
