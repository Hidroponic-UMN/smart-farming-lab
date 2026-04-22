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
  Thermometer,
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
  PH_TEMP_TABLE,
  lookupTempCompensated,
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
  waterTemp: number;
  compensatedPh: number;
  commandStatus: CommandStatus;
  commandResult?: CommandResult;
}

export function PhCalibrationSteps({
  rackId,
  onComplete,
  onCancel,
}: PhCalibrationStepsProps) {
  const sensor = useLiveSensor(rackId);

  // Step 2: Water temperature
  const [waterTemp, setWaterTemp] = useState<number | null>(null);

  // Buffer results (3-point)
  const [midResult, setMidResult] = useState<BufferResult | null>(null);
  const [lowResult, setLowResult] = useState<BufferResult | null>(null);
  const [highResult, setHighResult] = useState<BufferResult | null>(null);

  // Current sending state
  const [isSending, setIsSending] = useState(false);

  function handleCaptureTemp() {
    setWaterTemp(sensor.waterTemp);
  }

  // Get compensated pH value for a buffer at the measured water temp
  function getCompensatedPh(bufferKey: "low" | "mid" | "high"): number {
    if (waterTemp === null) return PH_BUFFERS[bufferKey].value;
    const nominalKey =
      bufferKey === "low" ? "4.01" : bufferKey === "mid" ? "6.86" : "9.18";
    return lookupTempCompensated(PH_TEMP_TABLE[nominalKey], waterTemp);
  }

  // Send calibration command for a specific buffer
  const handleCaptureBuffer = useCallback(
    async (bufferKey: "low" | "mid" | "high") => {
      if (waterTemp === null) return;
      setIsSending(true);

      const compensatedPh = getCompensatedPh(bufferKey);
      const setter =
        bufferKey === "low"
          ? setLowResult
          : bufferKey === "mid"
          ? setMidResult
          : setHighResult;

      setter({
        waterTemp,
        compensatedPh,
        commandStatus: "sending",
      });

      const result = await sendCalibrationCommand(
        rackId,
        "KALIBRASI_PH",
        compensatedPh,
        waterTemp
      );

      const status: CommandStatus = result.success ? "success" : "failed";

      setter({
        waterTemp,
        compensatedPh,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rackId, waterTemp]
  );

  // Build status badge
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
      case "timeout":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1">
            <AlertCircle className="w-3 h-3" />
            Timeout (mungkin berhasil)
          </Badge>
        );
      default:
        return null;
    }
  }

  // Build a capture step for a given buffer
  function buildCaptureStep(
    bufferKey: "low" | "mid" | "high",
    result: BufferResult | null,
    stepNum: number
  ): WizardStep {
    const buf = PH_BUFFERS[bufferKey];
    const stepLabel =
      bufferKey === "low"
        ? "Asam"
        : bufferKey === "mid"
        ? "Netral"
        : "Basa";
    const compensatedPh = getCompensatedPh(bufferKey);

    return {
      id: `capture-${bufferKey}`,
      title: `${buf.label} (${stepLabel})`,
      description: `Celupkan sensor ke larutan buffer ${buf.label}`,
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: result?.commandStatus === "success",
      content: (
        <div className="space-y-5">
          {/* Temperature compensation info */}
          {waterTemp !== null && (
            <div
              className="rounded-xl border-2 p-4"
              style={{
                borderColor: buf.color + "33",
                backgroundColor: buf.color + "08",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Kompensasi Suhu
                </span>
                <Badge variant="outline" className="font-mono">
                  {waterTemp.toFixed(1)}°C
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Nominal: {buf.value}
                </span>
                <span className="text-xs text-muted-foreground">→</span>
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: buf.color }}
                >
                  Actual: {compensatedPh.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah {stepNum}:</strong>{" "}
              {stepNum > 1
                ? "Bilas sensor dengan aquadest dan keringkan dengan tisu. "
                : ""}
              Larutkan serbuk kalibrasi{" "}
              <strong style={{ color: buf.color }}>{buf.label}</strong> ({stepLabel})
              dengan 250ml aquadest. Celupkan sensor pH Rack {rackId} ke dalam
              larutan. Tunggu pembacaan stabil, lalu tekan tombol di bawah.
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
            disabled={!sensor.isOnline || isSending || waterTemp === null}
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
                Recalibrate {buf.label}
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Calibrate {buf.label} ({compensatedPh.toFixed(2)})
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
                result.commandStatus === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : result.commandStatus === "failed"
                  ? "border-red-500/20 bg-red-500/5"
                  : result.commandStatus === "sending"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}
            >
              <div className="flex-1">
                <StatusBadge status={result.commandStatus} />
                <p className="text-xs text-muted-foreground mt-2">
                  Dikirim: pH {result.compensatedPh.toFixed(2)} @ {result.waterTemp.toFixed(1)}°C
                </p>
                {result.commandResult?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {result.commandResult.error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    };
  }

  const allDone =
    midResult?.commandStatus === "success" &&
    lowResult?.commandStatus === "success" &&
    highResult?.commandStatus === "success";

  const steps: WizardStep[] = [
    // Step 1: Preparation
    {
      id: "prepare",
      title: "Persiapan",
      description: "Siapkan alat dan bahan untuk kalibrasi sensor pH",
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
                "Serbuk kalibrasi pH 4.00 (asam)",
                "Serbuk kalibrasi pH 6.86 (netral)",
                "Serbuk kalibrasi pH 9.18 (basa)",
                "3 gelas/wadah bersih + masing-masing 250ml aquadest",
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
          <div className="grid grid-cols-3 gap-3">
            {(["low", "mid", "high"] as const).map((key) => {
              const buf = PH_BUFFERS[key];
              return (
                <div
                  key={key}
                  className="rounded-lg p-3 border-2 text-center"
                  style={{
                    borderColor: buf.color + "33",
                    backgroundColor: buf.color + "08",
                  }}
                >
                  <p
                    className="text-lg font-bold font-mono"
                    style={{ color: buf.color }}
                  >
                    {buf.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{buf.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-500">
                  Penting!
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Suhu air sangat mempengaruhi nilai pH buffer. Langkah pertama
                  adalah mengukur suhu air untuk kompensasi otomatis.
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

    // Step 2: Measure Water Temperature
    {
      id: "temperature",
      title: "Ukur Suhu Air",
      description: "Celupkan sensor suhu untuk kompensasi pH buffer",
      icon: <Thermometer className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: waterTemp !== null,
      content: (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong> Celupkan sensor suhu (DS18B20) Rack{" "}
              {rackId} ke dalam larutan buffer pertama (pH 6.86). Tunggu
              pembacaan stabil, lalu tekan &quot;Capture Suhu&quot;.
            </p>
          </div>

          {/* Live Water Temp */}
          <LiveSensorDisplay
            value={sensor.waterTemp}
            label="Water Temperature"
            unit="°C"
            history={sensor.phHistory.map(() => sensor.waterTemp)}
            isStable={true}
            isOnline={sensor.isOnline}
            color="#f59e0b"
          />

          <Button
            size="lg"
            onClick={handleCaptureTemp}
            disabled={!sensor.isOnline}
            className="w-full h-14 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all"
          >
            <Thermometer className="w-5 h-5 mr-2" />
            {waterTemp !== null
              ? `Recapture Suhu (${waterTemp.toFixed(1)}°C)`
              : "Capture Suhu"}
          </Button>

          {waterTemp !== null && (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-500">
                  Suhu tercapture: {waterTemp.toFixed(1)}°C
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Nilai pH buffer yang akan digunakan:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "mid", "high"] as const).map((key) => {
                  const buf = PH_BUFFERS[key];
                  const actual = getCompensatedPh(key);
                  return (
                    <div
                      key={key}
                      className="rounded-lg p-2 border text-center"
                      style={{
                        borderColor: buf.color + "33",
                        backgroundColor: buf.color + "08",
                      }}
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {buf.label}
                      </p>
                      <p
                        className="text-sm font-bold font-mono"
                        style={{ color: buf.color }}
                      >
                        {actual.toFixed(2)}
                      </p>
                      {actual !== buf.value && (
                        <p className="text-[10px] text-muted-foreground line-through">
                          {buf.value}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ),
    },

    // Step 3: Mid-point (pH 6.86) — most important, do first
    buildCaptureStep("mid", midResult, 1),

    // Step 4: Low-point (pH 4.00)
    buildCaptureStep("low", lowResult, 2),

    // Step 5: High-point (pH 9.18)
    buildCaptureStep("high", highResult, 3),

    // Step 6: Review
    {
      id: "review",
      title: "Review",
      description: "Review hasil kalibrasi",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "mid" as const, result: midResult },
              { key: "low" as const, result: lowResult },
              { key: "high" as const, result: highResult },
            ].map(({ key, result }) => {
              const buf = PH_BUFFERS[key];
              const ok = result?.commandStatus === "success";
              return (
                <div
                  key={key}
                  className={`rounded-xl p-4 border-2 text-center ${
                    ok
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  {ok ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  )}
                  <p
                    className="text-lg font-bold font-mono"
                    style={{ color: buf.color }}
                  >
                    {result?.compensatedPh.toFixed(2) || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{buf.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ok ? "✓ Berhasil" : "✗ Belum/Gagal"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Temperature Used */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Suhu air saat kalibrasi:
            </span>
            <span className="font-bold font-mono text-foreground">
              {waterTemp?.toFixed(1) || "—"}°C
            </span>
          </div>

          {/* Status */}
          {allDone ? (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold text-emerald-500 text-lg">
                Kalibrasi pH Berhasil!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Semua 3 titik sudah dikalibrasi pada ESP32 Rack {rackId}.
                <br />
                Sensor sekarang mengirim nilai pH yang sudah dikalibrasi.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Beberapa titik belum dikalibrasi. Kembali ke langkah sebelumnya
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
      title={`pH Calibration — Rack ${rackId}`}
      subtitle="Kalibrasi 3 titik: pH 4.00, pH 6.86, pH 9.18 (temperature-compensated)"
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
      accentColor="#10b981"
    />
  );
}
