"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Beaker,
  Target,
  CheckCircle2,
  AlertCircle,
  Thermometer,
} from "lucide-react";
import { LiveSensorDisplay } from "./live-sensor-display";
import {
  CalibrationWizard,
  type WizardStep,
} from "./calibration-wizard";
import {
  computeTdsCalibration,
  applyTdsCalibration,
  saveCalibration,
  TDS_REFERENCE_PPM,
  type TdsCalibrationPoint,
} from "@/lib/calibration";
import { useLiveSensor } from "@/lib/use-live-sensor";

interface TdsCalibrationStepsProps {
  rackId: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function TdsCalibrationSteps({
  rackId,
  onComplete,
  onCancel,
}: TdsCalibrationStepsProps) {
  const sensor = useLiveSensor(rackId);

  const [targetPpm, setTargetPpm] = useState<string>(String(TDS_REFERENCE_PPM));
  const [capturedPoint, setCapturedPoint] =
    useState<TdsCalibrationPoint | null>(null);
  const [coefficients, setCoefficients] = useState<{
    k_factor: number;
    offset: number;
  } | null>(null);

  function handleCapture() {
    const ppm = parseFloat(targetPpm);
    if (isNaN(ppm) || ppm <= 0) return;

    const point: TdsCalibrationPoint = {
      rawValue: sensor.rawTds,
      targetPpm: ppm,
      waterTempC: sensor.waterTemp,
    };
    setCapturedPoint(point);

    const result = computeTdsCalibration(point);
    setCoefficients(result);
  }

  function handleSave() {
    if (coefficients) {
      saveCalibration(rackId, {
        tds_k_factor: coefficients.k_factor,
        tds_offset: coefficients.offset,
        tds_calibrated_at: new Date().toISOString(),
        calibrated_by: "Lab Admin",
      });
    }
    onComplete();
  }

  function getPreviewValues() {
    if (!coefficients) return [];
    const testRaws = [0, 200, 500, 800, 1000, 1500, 2000, 3000, 4095];
    return testRaws.map((raw) => ({
      raw,
      calibrated: applyTdsCalibration(
        raw,
        coefficients.k_factor,
        coefficients.offset,
        25
      ),
    }));
  }

  const steps: WizardStep[] = [
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
                  Catatan Penting
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Kalibrasi TDS dipengaruhi oleh suhu air. Sensor water temp
                  pada Rack {rackId} akan digunakan untuk kompensasi suhu
                  otomatis.
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
    {
      id: "calibrate",
      title: "Kalibrasi",
      description:
        "Celupkan sensor ke larutan kalibrasi dan capture reading",
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: capturedPoint !== null,
      content: (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong> Bilas sensor TDS dengan aquadest,
              celupkan ke larutan kalibrasi. Masukkan nilai ppm larutan di
              bawah, tunggu reading stabil, lalu capture.
            </p>
          </div>

          {/* Target PPM Input */}
          <div className="rounded-xl border-2 border-border bg-card p-4">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Target PPM Larutan Kalibrasi
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={targetPpm}
                onChange={(e) => setTargetPpm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-mono text-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                           transition-all"
                placeholder="1382"
                min={1}
              />
              <span className="text-sm text-muted-foreground font-medium">
                ppm (mg/L)
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {["342", "500", "1000", "1382"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTargetPpm(preset)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
                    targetPpm === preset
                      ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {preset} ppm
                </button>
              ))}
            </div>
          </div>

          {/* Water Temp Info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
            <Thermometer className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              Water Temperature:
            </span>
            <span className="text-sm font-bold font-mono text-foreground">
              {sensor.waterTemp.toFixed(1)}°C
            </span>
            <span className="text-xs text-muted-foreground">
              (auto-compensation)
            </span>
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

          {/* Capture Button */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={
                !sensor.isOnline ||
                !targetPpm ||
                parseFloat(targetPpm) <= 0
              }
              className="flex-1 h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              <Target className="w-5 h-5 mr-2" />
              {capturedPoint
                ? `Recapture (Current raw: ${capturedPoint.rawValue})`
                : `Capture ${targetPpm} ppm`}
            </Button>
          </div>

          {capturedPoint && (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-500">
                  Calibration point captured!
                </p>
                <p className="text-xs text-muted-foreground">
                  Raw ADC = {capturedPoint.rawValue} → {capturedPoint.targetPpm}{" "}
                  ppm (at {capturedPoint.waterTempC.toFixed(1)}°C)
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "review",
      title: "Review & Save",
      description: "Review koefisien kalibrasi dan simpan",
      icon: <CheckCircle2 className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: coefficients !== null,
      content: (
        <div className="space-y-6">
          {coefficients && capturedPoint ? (
            <>
              {/* Calibration Point Summary */}
              <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
                <h4 className="font-semibold text-foreground">
                  Calibration Point
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                    <p className="text-xs text-muted-foreground">Raw ADC</p>
                    <p className="text-xl font-bold font-mono text-blue-500">
                      {capturedPoint.rawValue}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-xl font-bold font-mono text-emerald-500">
                      {capturedPoint.targetPpm}
                    </p>
                    <p className="text-xs text-muted-foreground">ppm</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="text-xl font-bold font-mono text-amber-500">
                      {capturedPoint.waterTempC.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">°C</p>
                  </div>
                </div>
              </div>

              {/* Computed Coefficients */}
              <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
                <h4 className="font-semibold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Koefisien Kalibrasi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">K-Factor</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {coefficients.k_factor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Offset</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {coefficients.offset}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formula: TDS = {coefficients.k_factor} × (rawADC ÷ tempCoeff) +{" "}
                  {coefficients.offset}
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <h4 className="font-semibold text-foreground mb-3">
                  Preview Konversi (at 25°C)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    Raw ADC
                  </div>
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    →
                  </div>
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    TDS (ppm)
                  </div>
                  {getPreviewValues().map(({ raw, calibrated }) => (
                    <div key={`row-${raw}`} className="contents">
                      <div className="font-mono py-1 text-foreground">
                        {raw}
                      </div>
                      <div className="text-muted-foreground py-1">
                        →
                      </div>
                      <div
                        className="font-mono font-medium py-1 text-foreground"
                      >
                        {calibrated.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Anda harus capture titik kalibrasi sebelum bisa menyimpan.
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
      subtitle="Kalibrasi 1 titik dengan larutan referensi"
      steps={steps}
      onComplete={handleSave}
      onCancel={onCancel}
      accentColor="#3b82f6"
    />
  );
}
