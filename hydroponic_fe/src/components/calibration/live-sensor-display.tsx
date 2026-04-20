"use client";

import { useEffect, useRef } from "react";

interface LiveSensorDisplayProps {
  /** Current raw ADC value */
  value: number;
  /** Label for the sensor */
  label: string;
  /** Unit string to display */
  unit: string;
  /** Recent reading history for the mini chart */
  history: number[];
  /** Whether the current reading is stable */
  isStable: boolean;
  /** Whether sensor data is being received */
  isOnline: boolean;
  /** Accent color */
  color?: string;
}

export function LiveSensorDisplay({
  value,
  label,
  unit,
  history,
  isStable,
  isOnline,
  color = "#10b981",
}: LiveSensorDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw mini chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Compute range
    const minVal = Math.min(...history) - 10;
    const maxVal = Math.max(...history) + 10;
    const range = maxVal - minVal || 1;

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + "30");
    gradient.addColorStop(1, color + "05");

    ctx.beginPath();
    ctx.moveTo(0, h);

    history.forEach((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - minVal) / range) * h * 0.85 - h * 0.05;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    history.forEach((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - minVal) / range) * h * 0.85 - h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw latest point
    if (history.length > 0) {
      const lastX = w;
      const lastY =
        h -
        ((history[history.length - 1] - minVal) / range) * h * 0.85 -
        h * 0.05;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = color + "60";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [history, color]);

  return (
    <div className="relative rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm p-5 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="text-xs text-muted-foreground">({unit})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] text-muted-foreground">
              {isOnline ? "Live" : "Offline"}
            </span>
          </div>

          {/* Stability indicator */}
          <div
            className={`
              px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-500
              ${
                isStable
                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-500 border-amber-500/30"
              }
            `}
          >
            {isStable ? "✓ Stable" : "⟳ Reading..."}
          </div>
        </div>
      </div>

      {/* Big Value Display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className={`text-4xl font-bold tabular-nums tracking-tight transition-all duration-300 ${
            !isOnline
              ? "text-muted-foreground"
              : isStable
              ? "text-foreground"
              : ""
          }`}
          style={{ color: isOnline && !isStable ? color : undefined }}
        >
          {isOnline ? Math.round(value) : "—"}
        </span>
        <span className="text-sm text-muted-foreground font-medium">
          raw ADC
        </span>
      </div>

      {/* Mini Chart */}
      <div className="relative h-16 rounded-lg overflow-hidden bg-muted/30">
        {history.length >= 2 ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: "block" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Waiting for data...
          </div>
        )}
      </div>

      {/* Stats */}
      {history.length > 0 && (
        <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
          <span>
            Min: <span className="font-mono font-medium text-foreground">{Math.round(Math.min(...history))}</span>
          </span>
          <span>
            Avg: <span className="font-mono font-medium text-foreground">{Math.round(history.reduce((a, b) => a + b, 0) / history.length)}</span>
          </span>
          <span>
            Max: <span className="font-mono font-medium text-foreground">{Math.round(Math.max(...history))}</span>
          </span>
          <span>{history.length} samples</span>
        </div>
      )}
    </div>
  );
}
