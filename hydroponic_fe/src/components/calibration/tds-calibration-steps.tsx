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
  TDS_REFERENCE_PPM,
  TDS_TEMP_TABLE,
  lookupTempCompensated,
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

  // Water temperature
  const [waterTemp, setWaterTemp] = useState<number | null>(null);

  // Calibration result
  const [commandStatus, setCommandStatus] = useState<CommandStatus>("idle");
  const [commandResult, setCommandResult] = useState<CommandResult | null>(
    null
  );
  const [compensatedPpm, setCompensatedPpm] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  function handleCaptureTemp() {
    setWaterTemp(sensor.waterTemp);
  }

  function getCompensatedPpm(): number {
    if (waterTemp === null) return TDS_REFERENCE_PPM;
    return lookupTempCompensated(TDS_TEMP_TABLE, waterTemp);
  }

  const handleCapture = useCallback(async () => {
    if (waterTemp === null) return;
    setIsSending(true);

    const ppm = getCompensatedPpm();
    setCompensatedPpm(ppm);
    setCommandStatus("sending");

    const result = await sendCalibrationCommand(
      rackId,
      "KALIBRASI_TDS",
      ppm,
      waterTemp
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rackId, waterTemp]);

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
      id: "prepare",
      title: "Persiapan",
      description: "Siapkan alat dan bahan untuk kalibrasi sensor TDS",
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

          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-500">
                  Penting: Suhu Sangat Mempengaruhi TDS!
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Larutan {TDS_REFERENCE_PPM} ppm @ 25°C memiliki nilai berbeda
                  di suhu lain. Contoh: @ 20°C =1251 ppm, @ 30°C = 1515 ppm.
                  Langkah pertama akan mengukur suhu air untuk kompensasi otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* TDS Temperature Table Preview */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Tabel Kompensasi Suhu (Larutan {TDS_REFERENCE_PPM} ppm)
            </h4>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {TDS_TEMP_TABLE.slice(4).map(({ temp, value }) => (
                <div
                  key={temp}
                  className={`rounded p-1.5 text-center ${
                    temp === 25
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-muted/50"
                  }`}
                >
                  <p className="font-mono font-bold text-foreground">
                    {value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{temp}°C</p>
                </div>
              ))}
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

    // Step 2: Measure Water Temperature
    {
      id: "temperature",
      title: "Ukur Suhu Air",
      description:
        "Celupkan sensor suhu ke larutan kalibrasi TDS",
      icon: <Thermometer className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: waterTemp !== null,
      content: (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong> Celupkan sensor suhu (DS18B20) Rack{" "}
              {rackId} ke dalam larutan kalibrasi TDS {TDS_REFERENCE_PPM} ppm.
              Tunggu pembacaan stabil, lalu tekan &quot;Capture Suhu&quot;.
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
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-3 border border-blue-500/30 bg-blue-500/5 text-center flex-1">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Nominal @ 25°C
                  </p>
                  <p className="text-lg font-bold font-mono text-muted-foreground line-through">
                    {TDS_REFERENCE_PPM}
                  </p>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="rounded-lg p-3 border-2 border-blue-500/30 bg-blue-500/5 text-center flex-1">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Actual @ {waterTemp.toFixed(1)}°C
                  </p>
                  <p className="text-lg font-bold font-mono text-blue-500">
                    {getCompensatedPpm().toFixed(0)} ppm
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },

    // Step 3: Calibrate
    {
      id: "calibrate",
      title: "Kalibrasi",
      description:
        "Celupkan sensor TDS ke larutan kalibrasi dan capture reading",
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: commandStatus === "success",
      content: (
        <div className="space-y-5">
          {/* Temperature compensation info */}
          {waterTemp !== null && (
            <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Kompensasi Suhu
                </span>
                <Badge variant="outline" className="font-mono">
                  {waterTemp.toFixed(1)}°C
                </Badge>
              </div>
              <p className="text-sm text-foreground">
                Larutan {TDS_REFERENCE_PPM} ppm @ 25°C ≈{" "}
                <strong className="text-blue-500">
                  {getCompensatedPpm().toFixed(0)} ppm
                </strong>{" "}
                @ {waterTemp.toFixed(1)}°C
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong> Bilas sensor TDS dengan aquadest.
              Celupkan ke larutan kalibrasi TDS. Tunggu pembacaan stabil, lalu
              tekan tombol di bawah.
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

          {/* Capture + Send Button */}
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={!sensor.isOnline || isSending || waterTemp === null}
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
                Recalibrate TDS
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Calibrate TDS ({getCompensatedPpm().toFixed(0)} ppm)
              </>
            )}
          </Button>

          {/* Result */}
          {commandStatus !== "idle" && (
            <div
              className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
                commandStatus === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : commandStatus === "failed"
                  ? "border-red-500/20 bg-red-500/5"
                  : commandStatus === "sending"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}
            >
              <div className="flex-1">
                <StatusBadge status={commandStatus} />
                {compensatedPpm && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Dikirim: {compensatedPpm.toFixed(0)} ppm @{" "}
                    {waterTemp?.toFixed(1)}°C
                  </p>
                )}
                {commandResult?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {commandResult.error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },

    // Step 4: Review
    {
      id: "review",
      title: "Review",
      description: "Review hasil kalibrasi",
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
            <h4 className="font-semibold text-foreground">Calibration Summary</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">Suhu Air</p>
                <p className="text-xl font-bold font-mono text-amber-500">
                  {waterTemp?.toFixed(1) || "—"}°C
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-xl font-bold font-mono text-blue-500">
                  {compensatedPpm?.toFixed(0) || "—"}
                </p>
                <p className="text-xs text-muted-foreground">ppm</p>
              </div>
              <div
                className={`rounded-lg p-3 text-center ${
                  commandStatus === "success"
                    ? "bg-emerald-500/5 border border-emerald-500/20"
                    : "bg-red-500/5 border border-red-500/20"
                }`}
              >
                <p className="text-xs text-muted-foreground">Status</p>
                {commandStatus === "success" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mt-1" />
                )}
              </div>
            </div>
          </div>

          {commandStatus === "success" ? (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold text-emerald-500 text-lg">
                Kalibrasi TDS Berhasil!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                ESP32 Rack {rackId} sudah dikalibrasi dengan{" "}
                {compensatedPpm?.toFixed(0)} ppm @ {waterTemp?.toFixed(1)}°C.
                <br />
                Sensor sekarang mengirim nilai TDS yang sudah dikalibrasi.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Kalibrasi belum berhasil. Kembali ke langkah sebelumnya untuk
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
      title={`TDS Calibration — Rack ${rackId}`}
      subtitle={`Kalibrasi 1 titik: ${TDS_REFERENCE_PPM} ppm (temperature-compensated)`}
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
      accentColor="#3b82f6"
    />
  );
}
