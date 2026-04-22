"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Beaker,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { LiveSensorDisplay } from "./live-sensor-display";
import {
  CalibrationWizard,
  type WizardStep,
} from "./calibration-wizard";
import {
  computePhCalibration,
  applyPhCalibration,
  saveCalibration,
  PH_BUFFERS,
  type PhCalibrationPoint,
} from "@/lib/calibration";
import { useLiveSensor } from "@/lib/use-live-sensor";

interface PhCalibrationStepsProps {
  rackId: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function PhCalibrationSteps({
  rackId,
  onComplete,
  onCancel,
}: PhCalibrationStepsProps) {
  const sensor = useLiveSensor(rackId);

  // Captured calibration points (3-point)
  const [lowPoint, setLowPoint] = useState<PhCalibrationPoint | null>(null);
  const [midPoint, setMidPoint] = useState<PhCalibrationPoint | null>(null);
  const [highPoint, setHighPoint] = useState<PhCalibrationPoint | null>(null);

  // Computed coefficients
  const [coefficients, setCoefficients] = useState<{
    slope: number;
    offset: number;
  } | null>(null);

  function handleCaptureMid() {
    const point: PhCalibrationPoint = {
      rawValue: sensor.rawPh,
      phValue: PH_BUFFERS.mid.value,
    };
    setMidPoint(point);
  }

  function handleCaptureLow() {
    const point: PhCalibrationPoint = {
      rawValue: sensor.rawPh,
      phValue: PH_BUFFERS.low.value,
    };
    setLowPoint(point);
  }

  function handleCaptureHigh() {
    const point: PhCalibrationPoint = {
      rawValue: sensor.rawPh,
      phValue: PH_BUFFERS.high.value,
    };
    setHighPoint(point);

    // Compute coefficients when all 3 points are captured
    if (midPoint && lowPoint) {
      const result = computePhCalibration(
        { rawValue: lowPoint.rawValue, phValue: PH_BUFFERS.low.value },
        { rawValue: midPoint.rawValue, phValue: PH_BUFFERS.mid.value },
        { rawValue: sensor.rawPh, phValue: PH_BUFFERS.high.value }
      );
      setCoefficients(result);
    }
  }

  // Recompute when going back and recapturing earlier points
  function recompute() {
    const points: PhCalibrationPoint[] = [];
    if (lowPoint) points.push(lowPoint);
    if (midPoint) points.push(midPoint);
    if (highPoint) points.push(highPoint);
    if (points.length >= 2) {
      setCoefficients(computePhCalibration(...points));
    }
  }

  function handleSave() {
    if (coefficients) {
      saveCalibration(rackId, {
        ph_slope: coefficients.slope,
        ph_offset: coefficients.offset,
        ph_calibrated_at: new Date().toISOString(),
        calibrated_by: "Lab Admin",
      });
    }
    onComplete();
  }

  // Test conversion preview
  function getPreviewValues() {
    if (!coefficients) return [];
    const testRaws = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4095];
    return testRaws.map((raw) => ({
      raw,
      calibrated: applyPhCalibration(raw, coefficients.slope, coefficients.offset),
    }));
  }

  // Build a capture step for a given buffer
  function buildCaptureStep(
    bufferKey: "low" | "mid" | "high",
    captured: PhCalibrationPoint | null,
    onCapture: () => void
  ): WizardStep {
    const buf = PH_BUFFERS[bufferKey];
    const stepLabel =
      bufferKey === "low"
        ? "Asam (pH 4.00)"
        : bufferKey === "mid"
        ? "Netral (pH 6.86)"
        : "Basa (pH 9.18)";

    return {
      id: `capture-${bufferKey}`,
      title: buf.label,
      description: `Celupkan sensor ke larutan buffer ${buf.label} dan capture reading`,
      icon: <Target className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: captured !== null,
      content: (
        <div className="space-y-6">
          <div
            className="rounded-xl border-2 p-4"
            style={{
              borderColor: buf.color + "33",
              backgroundColor: buf.color + "08",
            }}
          >
            <p className="text-sm text-foreground">
              <strong>Langkah:</strong>{" "}
              {bufferKey !== "low"
                ? "Bilas sensor dengan aquadest dan keringkan dengan tisu. "
                : ""}
              Larutkan serbuk kalibrasi <strong>{buf.label}</strong> ({stepLabel})
              dengan 250ml aquadest. Celupkan sensor pH Rack {rackId} ke dalam
              larutan. Tunggu pembacaan stabil, lalu tekan{" "}
              <strong>&quot;Capture {buf.label}&quot;</strong>.
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

          {/* Capture Button */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={onCapture}
              disabled={!sensor.isOnline}
              className="flex-1 h-14 text-base font-bold text-white shadow-lg transition-all"
              style={{
                backgroundColor: buf.color,
              }}
            >
              <Target className="w-5 h-5 mr-2" />
              {captured
                ? `Recapture ${buf.label} (Raw: ${captured.rawValue})`
                : `Capture ${buf.label}`}
            </Button>
          </div>

          {captured && (
            <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-500">
                  Point captured!
                </p>
                <p className="text-xs text-muted-foreground">
                  Raw ADC = {captured.rawValue} → {buf.label}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    };
  }

  const allCaptured = lowPoint && midPoint && highPoint;

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
                    {buf.value.toFixed(2)}
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
                  Pastikan sensor pH pada <strong>Rack {rackId}</strong> dalam
                  keadaan bersih. Larutkan serbuk kalibrasi di wadah terpisah
                  sebelum memulai. Bilas sensor dengan aquadest di antara setiap
                  langkah.
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

    // Step 2: Mid-point (pH 6.86) — most important, do first
    buildCaptureStep("mid", midPoint, handleCaptureMid),

    // Step 3: Low-point (pH 4.00)
    buildCaptureStep("low", lowPoint, handleCaptureLow),

    // Step 4: High-point (pH 9.18)
    buildCaptureStep("high", highPoint, handleCaptureHigh),

    // Step 5: Review & Save
    {
      id: "review",
      title: "Review & Save",
      description: "Review koefisien kalibrasi dan simpan",
      icon: <CheckCircle2 className="w-5 h-5" />,
      requiresAction: true,
      actionCompleted: coefficients !== null,
      content: (
        <div className="space-y-6">
          {coefficients && allCaptured ? (
            <>
              {/* Calibration Points */}
              <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
                <h4 className="font-semibold text-foreground">
                  Calibration Points (3-point)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      point: midPoint,
                      buf: PH_BUFFERS.mid,
                      label: "Netral",
                    },
                    {
                      point: lowPoint,
                      buf: PH_BUFFERS.low,
                      label: "Asam",
                    },
                    {
                      point: highPoint,
                      buf: PH_BUFFERS.high,
                      label: "Basa",
                    },
                  ].map(({ point, buf, label }) => (
                    <div
                      key={buf.label}
                      className="rounded-lg p-3 border"
                      style={{
                        borderColor: buf.color + "33",
                        backgroundColor: buf.color + "08",
                      }}
                    >
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {label} ({buf.label})
                      </p>
                      <p
                        className="text-xl font-bold font-mono"
                        style={{ color: buf.color }}
                      >
                        {point!.rawValue}
                      </p>
                      <p className="text-xs text-muted-foreground">Raw ADC</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Computed Coefficients */}
              <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
                <h4 className="font-semibold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Koefisien Kalibrasi (Linear Regression)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Slope</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {coefficients.slope}
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
                  Formula: pH = {coefficients.slope} × rawADC +{" "}
                  {coefficients.offset}
                </p>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <h4 className="font-semibold text-foreground mb-3">
                  Preview Konversi
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    Raw ADC
                  </div>
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    →
                  </div>
                  <div className="font-semibold text-muted-foreground py-1 border-b border-border">
                    pH
                  </div>
                  {getPreviewValues().map(({ raw, calibrated }) => (
                    <div key={`row-${raw}`} className="contents">
                      <div className="font-mono py-1 text-foreground">
                        {raw}
                      </div>
                      <div className="text-muted-foreground py-1">→</div>
                      <div
                        className={`font-mono font-medium py-1 ${
                          calibrated >= 5.5 && calibrated <= 7.5
                            ? "text-emerald-500"
                            : calibrated < 4 || calibrated > 10
                            ? "text-red-500"
                            : "text-amber-500"
                        }`}
                      >
                        {calibrated.toFixed(2)}
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
                Anda harus capture ketiga titik kalibrasi (pH 4.00, pH 6.86,
                dan pH 9.18) sebelum bisa menyimpan.
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
      subtitle="Kalibrasi 3 titik: pH 4.00, pH 6.86, pH 9.18"
      steps={steps}
      onComplete={handleSave}
      onCancel={onCancel}
      accentColor="#10b981"
    />
  );
}
