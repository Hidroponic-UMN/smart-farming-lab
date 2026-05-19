"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Beaker,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { LiveSensorDisplay } from "./live-sensor-display";
import {
  CalibrationWizard,
  type WizardStep,
} from "./calibration-wizard";
import {
  TDS_REFERENCE_PPM,
  sendCalibrationCommand,
  saveCalibration,
  type CommandResult,
} from "@/lib/calibration";
import { useLiveSensor } from "@/lib/use-live-sensor";

interface TdsCalibrationStepsProps {
  rackId: number;
  onComplete: () => void;
  onCancel: () => void;
}

type CommandStatus = "idle" | "sending" | "success" | "failed" | "timeout";

export function TdsCalibrationSteps({
  rackId,
  onComplete,
  onCancel,
}: TdsCalibrationStepsProps) {
  const sensor = useLiveSensor(rackId);

  // Calibration result
  const [commandStatus, setCommandStatus] = useState<CommandStatus>("idle");
  const [commandResult, setCommandResult] = useState<CommandResult | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);

  const handleCapture = useCallback(async () => {
    setIsSending(true);
    setCommandStatus("sending");

    const result = await sendCalibrationCommand(
      rackId,
      "KALIBRASI_TDS",
      TDS_REFERENCE_PPM
    );

    setCommandResult(result);
    setCommandStatus(result.success ? "success" : "failed");

    if (result.success) {
      saveCalibration(rackId, {
        tds_calibrated_at: new Date().toISOString(),
        calibrated_by: "Lab Admin",
      });
    }

    setIsSending(false);
  }, [rackId]);

  // Status badge
  function StatusBadge({ status }: { status: CommandStatus }) {
    switch (status) {
      case "sending":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Mengirim ke ESP32...
          </Badge>
        );
      case "success":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ESP32 ACK: Berhasil!
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            Gagal
          </Badge>
        );
      default:
        return null;
    }
  }

  const steps: WizardStep[] = [
    // Step 1: Preparation
    {
      title: "Persiapan",
      description: "Siapkan alat dan bahan untuk adjustment sensor TDS",
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Beaker className="w-4 h-4 text-blue-500" />
              Alat & Bahan yang Dibutuhkan
            </h4>
            <ul className="space-y-3">
              {[
                `Larutan kalibrasi TDS ${TDS_REFERENCE_PPM} ppm (mg/L)`,
                "1 gelas/wadah bersih",
                "Air aquadest untuk membilas sensor",
                "Tisu kering",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-500">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* TDS value card */}
          <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-5 text-center">
            <p className="text-3xl font-bold font-mono text-blue-500">
              {TDS_REFERENCE_PPM}
            </p>
            <p className="text-sm text-muted-foreground mt-1">ppm (mg/L)</p>
          </div>

          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-500">
                  Tips
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Celupkan sensor suhu dan sensor TDS <strong>bersamaan</strong>{" "}
                  ke dalam larutan kalibrasi. ESP32 akan membaca suhu air
                  secara otomatis untuk kompensasi.
                </p>
              </div>
            </div>
          </div>

          {/* Sensor status */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Status sensor Rack {rackId}:
              </span>
              <Badge
                variant="outline"
                className={
                  sensor.isOnline
                    ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                    : "text-red-500 border-red-500/30 bg-red-500/10"
                }
              >
                {sensor.isOnline ? "Online ✓" : "Offline ✗"}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },

    // Step 2: Calibrate
    {
      id: "calibrate",
      title: "Adjustment",
      description:
        "Celupkan sensor TDS + sensor suhu ke larutan adjustment",
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: commandStatus === "success",
      content: (
        <div className="space-y-5">
          {/* Instructions */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong> Bilas sensor TDS dan sensor suhu dengan
              aquadest. Celupkan <strong>keduanya bersamaan</strong> ke dalam
              larutan adjustment {TDS_REFERENCE_PPM} ppm. Tunggu pembacaan stabil
              (~30 detik), lalu tekan tombol di bawah.
            </p>
          </div>

          {/* Live Reading */}
          <LiveSensorDisplay
            value={sensor.rawTds}
            label="TDS Sensor"
            unit="Raw ADC"
            history={sensor.tdsHistory}
            isStable={sensor.tdsStable}
            isOnline={sensor.isOnline}
            color="#3b82f6"
          />

          {/* Water temp display */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Suhu air (auto-read oleh ESP32):
            </span>
            <span className="font-bold font-mono text-amber-500">
              {sensor.waterTemp?.toFixed(1) ?? "—"}°C
            </span>
          </div>

          {/* Capture + Send Button */}
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={!sensor.isOnline || isSending}
            className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Mengirim ke ESP32...
              </>
            ) : commandStatus === "success" ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Readjust TDS
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Adjust TDS ({TDS_REFERENCE_PPM} ppm)
              </>
            )}
          </Button>

          {/* Result */}
          {commandStatus !== "idle" && (
            <div
              className={`rounded-xl border-2 p-4 ${
                commandStatus === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : commandStatus === "failed"
                  ? "border-red-500/20 bg-red-500/5"
                  : commandStatus === "sending"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}
            >
              <StatusBadge status={commandStatus} />
              <p className="text-xs text-muted-foreground mt-2">
                Dikirim: known_value = {TDS_REFERENCE_PPM} ppm
              </p>
              {commandResult?.error && (
                <p className="text-xs text-red-500 mt-1">
                  {commandResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      ),
    },

    // Step 3: Review
    {
      id: "review",
      title: "Review",
      description: "Review hasil adjustment",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold text-foreground">
              Adjustment Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-2xl font-bold font-mono text-blue-500">
                  {TDS_REFERENCE_PPM}
                </p>
                <p className="text-xs text-muted-foreground">ppm</p>
              </div>
              <div
                className={`rounded-lg p-4 text-center ${
                  commandStatus === "success"
                    ? "bg-emerald-500/5 border border-emerald-500/20"
                    : "bg-red-500/5 border border-red-500/20"
                }`}
              >
                <p className="text-xs text-muted-foreground">Status</p>
                {commandStatus === "success" ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mt-2" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mt-2" />
                )}
              </div>
            </div>
          </div>

          {commandStatus === "success" ? (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold text-emerald-500 text-lg">
                Adjustment TDS Berhasil!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                ESP32 Rack {rackId} sudah di-adjust dengan {TDS_REFERENCE_PPM}{" "}
                ppm. Sensor sekarang mengirim nilai TDS yang sudah di-adjust.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Adjustment belum berhasil. Kembali ke langkah sebelumnya untuk
                mencoba lagi.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <CalibrationWizard
      title={`TDS Adjustment — Rack ${rackId}`}
      subtitle={`Adjustment 1 titik: ${TDS_REFERENCE_PPM} ppm (kompensasi suhu otomatis oleh ESP32)`}
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
      accentColor="#3b82f6"
    />
  );
}
