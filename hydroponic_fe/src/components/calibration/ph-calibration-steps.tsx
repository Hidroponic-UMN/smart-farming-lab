"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
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
  PH_BUFFERS,
  sendCalibrationCommand,
  saveCalibration,
  type CommandResult,
} from "@/lib/calibration";
import { useLiveSensor } from "@/lib/use-live-sensor";

interface PhCalibrationStepsProps {
  rackId: number;
  onComplete: () => void;
  onCancel: () => void;
}

type CommandStatus = "idle" | "sending" | "success" | "failed" | "timeout";

interface BufferResult {
  knownPh: number;
  commandStatus: CommandStatus;
  commandResult?: CommandResult;
}

export function PhCalibrationSteps({
  rackId,
  onComplete,
  onCancel,
}: PhCalibrationStepsProps) {
  const sensor = useLiveSensor(rackId);

  // Buffer results (2-point)
  const [neutralResult, setNeutralResult] = useState<BufferResult | null>(null);
  const [acidResult, setAcidResult] = useState<BufferResult | null>(null);

  // Current sending state
  const [isSending, setIsSending] = useState(false);

  // Send calibration command for a specific buffer
  const handleCaptureBuffer = useCallback(
    async (bufferKey: "neutral" | "acid") => {
      setIsSending(true);

      const buf = PH_BUFFERS[bufferKey];
      const setter = bufferKey === "neutral" ? setNeutralResult : setAcidResult;

      setter({
        knownPh: buf.value,
        commandStatus: "sending",
      });

      const result = await sendCalibrationCommand(
        rackId,
        "KALIBRASI_PH",
        buf.value
      );

      const status: CommandStatus = result.success ? "success" : "failed";

      setter({
        knownPh: buf.value,
        commandStatus: status,
        commandResult: result,
      });

      // Save to localStorage as backup
      if (result.success) {
        saveCalibration(rackId, {
          ph_calibrated_at: new Date().toISOString(),
          calibrated_by: "Lab Admin",
        });
      }

      setIsSending(false);
    },
    [rackId]
  );

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

  // Build a capture step for a given buffer
  function buildCaptureStep(
    bufferKey: "neutral" | "acid",
    result: BufferResult | null,
    stepNum: number,
    prevStepNote?: string
  ): WizardStep {
    const buf = PH_BUFFERS[bufferKey];
    const stepLabel = bufferKey === "neutral" ? "Netral" : "Asam";

    return {
      id: `capture-${bufferKey}`,
      title: `${buf.label} (${stepLabel})`,
      description: `Celupkan sensor ke larutan buffer ${buf.label}`,
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: result?.commandStatus === "success",
      content: (
        <div className="space-y-5">
          {/* Instructions */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah {stepNum}:</strong>{" "}
              {prevStepNote && (
                <span className="text-muted-foreground">{prevStepNote} </span>
              )}
              Larutkan serbuk kalibrasi{" "}
              <strong style={{ color: buf.color }}>{buf.label}</strong> ({stepLabel}){" "}
              dengan 250ml aquadest. Celupkan sensor pH Rack {rackId} ke dalam
              larutan. Tunggu pembacaan stabil (~30 detik), lalu tekan tombol di bawah.
            </p>
          </div>

          {/* Live Reading */}
          <LiveSensorDisplay
            value={sensor.rawPh}
            label="pH Sensor"
            unit="Raw ADC"
            history={sensor.phHistory}
            isStable={sensor.phStable}
            isOnline={sensor.isOnline}
            color={buf.color}
          />

          {/* Capture + Send Button */}
          <Button
            size="lg"
            onClick={() => handleCaptureBuffer(bufferKey)}
            disabled={!sensor.isOnline || isSending}
            className="w-full h-14 text-base font-bold text-white shadow-lg transition-all"
            style={{ backgroundColor: buf.color }}
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Mengirim ke ESP32...
              </>
            ) : result?.commandStatus === "success" ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Readjust {buf.label}
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Adjust {buf.label}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl border-2 p-4 ${
                result.commandStatus === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : result.commandStatus === "failed"
                  ? "border-red-500/20 bg-red-500/5"
                  : result.commandStatus === "sending"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}
            >
              <StatusBadge status={result.commandStatus} />
              <p className="text-xs text-muted-foreground mt-2">
                Dikirim: known_value = {result.knownPh.toFixed(2)}
              </p>
              {result.commandResult?.error && (
                <p className="text-xs text-red-500 mt-1">
                  {result.commandResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      ),
    };
  }

  const allDone =
    neutralResult?.commandStatus === "success" &&
    acidResult?.commandStatus === "success";

  const steps: WizardStep[] = [
    // Step 1: Preparation
    {
      id: "preparation",
      title: "Persiapan",
      description: "Siapkan alat dan bahan untuk adjustment sensor pH",
      icon: <FlaskConical className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Beaker className="w-4 h-4 text-emerald-500" />
              Alat & Bahan yang Dibutuhkan
            </h4>
            <ul className="space-y-3">
              {[
                "Serbuk kalibrasi pH 7.00 (netral)",
                "Serbuk kalibrasi pH 4.00 (asam)",
                "2 gelas/wadah bersih + masing-masing 250ml aquadest",
                "Air aquadest tambahan untuk membilas sensor",
                "Tisu kering",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-emerald-500">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buffer info cards */}
          <div className="grid grid-cols-2 gap-4">
            {(["neutral", "acid"] as const).map((key) => {
              const buf = PH_BUFFERS[key];
              return (
                <div
                  key={key}
                  className="rounded-xl p-4 border-2 text-center"
                  style={{
                    borderColor: buf.color + "33",
                    backgroundColor: buf.color + "08",
                  }}
                >
                  <p
                    className="text-2xl font-bold font-mono"
                    style={{ color: buf.color }}
                  >
                    {buf.value.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {key === "neutral" ? "Netral (pertama)" : "Asam (kedua)"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-500">
                  Urutan Penting!
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Kalibrasi harus dilakukan berurutan: <strong>pH 7.00 dulu</strong>,
                  baru <strong>pH 4.00</strong>. ESP32 menggunakan 2 titik ini
                  untuk menghitung slope dan offset.
                </p>
              </div>
            </div>
          </div>

          {/* Live sensor status */}
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

    // Step 2: Neutral (pH 7.00) — must be first
    buildCaptureStep("neutral", neutralResult, 1),

    // Step 3: Acid (pH 4.00)
    buildCaptureStep(
      "acid",
      acidResult,
      2,
      "Bilas sensor dengan aquadest dan keringkan dengan tisu."
    ),

    // Step 4: Review
    {
      id: "review",
      title: "Review",
      description: "Review hasil adjustment",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "neutral" as const, result: neutralResult },
              { key: "acid" as const, result: acidResult },
            ].map(({ key, result }) => {
              const buf = PH_BUFFERS[key];
              const ok = result?.commandStatus === "success";
              return (
                <div
                  key={key}
                  className={`rounded-xl p-5 border-2 text-center ${
                    ok
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  {ok ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-7 h-7 text-red-500 mx-auto mb-2" />
                  )}
                  <p
                    className="text-2xl font-bold font-mono"
                    style={{ color: buf.color }}
                  >
                    {buf.value.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {buf.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ok ? "✓ Berhasil" : "✗ Belum/Gagal"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Status */}
          {allDone ? (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold text-emerald-500 text-lg">
                Adjustment pH Berhasil!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Kedua titik sudah di-adjust pada ESP32 Rack {rackId}.
                <br />
                Sensor sekarang mengirim nilai pH yang sudah di-adjust.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Beberapa titik belum di-adjust. Kembali ke langkah sebelumnya
                untuk menyelesaikan.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <CalibrationWizard
      title={`pH Adjustment — Rack ${rackId}`}
      subtitle="Adjustment 2 titik: pH 7.00 (netral) dan pH 4.00 (asam)"
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
      accentColor="#10b981"
    />
  );
}
