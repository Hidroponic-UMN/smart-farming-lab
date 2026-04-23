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
} from "lucide-react";
import {
  loadCalibration,
  type CalibrationCoefficients,
} from "@/lib/calibration";

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="size-4" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Wrench className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sensor Calibration</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Kalibrasi sensor pH & TDS untuk setiap rack
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 rounded-full"
          >
            <Sparkles className="w-3 h-3 mr-1" />5 Racks
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 flex-shrink-0">
              <FlaskConical className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Panduan Kalibrasi Sensor
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kalibrasi sensor pH dan TDS penting untuk memastikan akurasi
                pembacaan. Disarankan melakukan kalibrasi{" "}
                <strong>setiap 2–4 minggu</strong> atau saat sensor baru
                dipasang. Pilih rack di bawah untuk memulai proses kalibrasi.
              </p>
            </div>
          </div>
        </div>

        {/* Rack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map((rackId) => {
            const cal = calibrations[rackId];
            const phCalibrated = cal?.ph_slope != null;
            const tdsCalibrated = cal?.tds_k_factor != null;
            const allCalibrated = phCalibrated && tdsCalibrated;

            return (
              <Card
                key={rackId}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border-2 pt-1 ${allCalibrated
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : "border-amber-500/20 hover:border-amber-500/40"
                  }`}
              >
                {/* Top accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${allCalibrated ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                />

                <CardContent className="p-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${allCalibrated
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                          }`}
                      >
                        {rackId}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          Rack {rackId}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {allCalibrated ? "Calibrated" : "Needs calibration"}
                        </p>
                      </div>
                    </div>

                    {allCalibrated ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>

                  {/* Sensor Status */}
                  <div className="space-y-3 mb-5">
                    {/* pH Sensor */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <FlaskConical
                          className={`w-4 h-4 ${phCalibrated
                              ? "text-emerald-500"
                              : "text-amber-500"
                            }`}
                        />
                        <span className="text-sm font-medium text-foreground">
                          pH Sensor
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {phCalibrated ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          >
                            Calibrated ✓
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"
                          >
                            Not Calibrated
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* TDS Sensor */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <Zap
                          className={`w-4 h-4 ${tdsCalibrated
                              ? "text-emerald-500"
                              : "text-amber-500"
                            }`}
                        />
                        <span className="text-sm font-medium text-foreground">
                          TDS Sensor
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tdsCalibrated ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          >
                            Calibrated ✓
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"
                          >
                            Not Calibrated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last Calibrated */}
                  {(cal?.ph_calibrated_at || cal?.tds_calibrated_at) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last:{" "}
                        {formatDate(
                          cal?.ph_calibrated_at || cal?.tds_calibrated_at || null
                        )}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href={`/calibration/${rackId}`} className="block">
                    <Button
                      variant="outline"
                      className={`w-full group transition-all ${allCalibrated
                          ? "hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-500"
                          : "hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-500"
                        }`}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      {allCalibrated ? "Kalibrasi Ulang" : "Mulai Kalibrasi"}
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
