/**
 * Calibration utilities for pH and TDS sensors.
 *
 * pH calibration uses 3-point least squares linear regression:
 *   Buffer powders: pH 4.00, pH 6.86, pH 9.18
 *   calibrated_pH = slope * rawADC + offset
 *
 * TDS calibration uses a K-factor approach:
 *   Reference solution: 1382 ppm (mg/L)
 *   calibrated_TDS = k_factor * rawADC + offset
 */

// ============================================================
//  Types
// ============================================================

export interface PhCalibrationPoint {
  rawValue: number;
  phValue: number;
}

export interface TdsCalibrationPoint {
  rawValue: number;
  targetPpm: number;
  waterTempC: number;
}

export interface CalibrationCoefficients {
  ph_slope: number | null;
  ph_offset: number | null;
  tds_k_factor: number | null;
  tds_offset: number | null;
  ph_calibrated_at: string | null;
  tds_calibrated_at: string | null;
  calibrated_by: string;
}

export const EMPTY_CALIBRATION: CalibrationCoefficients = {
  ph_slope: null,
  ph_offset: null,
  tds_k_factor: null,
  tds_offset: null,
  ph_calibrated_at: null,
  tds_calibrated_at: null,
  calibrated_by: "",
};

/** Standard pH buffer values available in the lab */
export const PH_BUFFERS = {
  low: { value: 4.0, label: "pH 4.00", color: "#ef4444" },
  mid: { value: 6.86, label: "pH 6.86", color: "#3b82f6" },
  high: { value: 9.18, label: "pH 9.18", color: "#8b5cf6" },
} as const;

/** Default TDS reference solution */
export const TDS_REFERENCE_PPM = 1382;

// ============================================================
//  pH Calibration Math (3-point least squares linear regression)
// ============================================================

/**
 * Compute pH calibration via least squares linear regression.
 * Supports 2 or 3 calibration points (pH 4.00, 6.86, 9.18).
 *
 * @param points - Array of {rawValue, phValue} calibration points (2 or 3)
 * @returns { slope, offset } where calibratedPH = slope * raw + offset
 */
export function computePhCalibration(
  ...points: PhCalibrationPoint[]
): { slope: number; offset: number } {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, offset: 6.86 };
  }

  // Least squares linear regression: pH = slope * raw + offset
  const sumX = points.reduce((s, p) => s + p.rawValue, 0);
  const sumY = points.reduce((s, p) => s + p.phValue, 0);
  const sumXY = points.reduce((s, p) => s + p.rawValue * p.phValue, 0);
  const sumX2 = points.reduce((s, p) => s + p.rawValue * p.rawValue, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 0.001) {
    return { slope: 0, offset: 6.86 };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const offset = (sumY - slope * sumX) / n;

  return {
    slope: Math.round(slope * 1_000_000) / 1_000_000,
    offset: Math.round(offset * 1_000) / 1_000,
  };
}

/**
 * Apply pH calibration to a raw ADC reading.
 */
export function applyPhCalibration(
  rawValue: number,
  slope: number,
  offset: number
): number {
  const calibrated = slope * rawValue + offset;
  // Clamp to valid pH range
  return Math.round(Math.min(14, Math.max(0, calibrated)) * 100) / 100;
}

// ============================================================
//  TDS Calibration Math (single-point K-factor)
// ============================================================

/**
 * Compute TDS K-factor from a single calibration point.
 *
 * TDS is temperature-compensated using coefficient 0.02 per °C deviation from 25°C.
 *
 * @param point - Raw reading, target ppm, and water temperature
 * @returns { k_factor, offset }
 */
export function computeTdsCalibration(
  point: TdsCalibrationPoint
): { k_factor: number; offset: number } {
  if (point.rawValue < 1) {
    return { k_factor: 1, offset: 0 };
  }

  // Temperature compensation coefficient
  const tempCoefficient = 1.0 + 0.02 * (point.waterTempC - 25.0);
  const compensatedRaw = point.rawValue / tempCoefficient;

  const k_factor = point.targetPpm / compensatedRaw;

  return {
    k_factor: Math.round(k_factor * 1_000_000) / 1_000_000,
    offset: 0,
  };
}

/**
 * Apply TDS calibration to a raw ADC reading.
 */
export function applyTdsCalibration(
  rawValue: number,
  k_factor: number,
  offset: number,
  waterTempC: number = 25
): number {
  const tempCoefficient = 1.0 + 0.02 * (waterTempC - 25.0);
  const compensatedRaw = rawValue / tempCoefficient;
  const calibrated = k_factor * compensatedRaw + offset;
  return Math.round(Math.max(0, calibrated) * 10) / 10;
}

// ============================================================
//  Stability Detection
// ============================================================

/**
 * Determine if a series of readings is stable.
 * Returns true if std deviation of last N readings is below threshold.
 */
export function isStable(
  readings: number[],
  windowSize: number = 5,
  threshold: number = 10
): boolean {
  if (readings.length < windowSize) return false;

  const window = readings.slice(-windowSize);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance =
    window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window.length;
  const stdDev = Math.sqrt(variance);

  return stdDev < threshold;
}

// ============================================================
//  localStorage Helpers
//  (Temporary until backend calibration endpoint is ready)
// ============================================================

const STORAGE_KEY = "hydroponic_calibration";

function getStorageData(): Record<string, CalibrationCoefficients> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorageData(data: Record<string, CalibrationCoefficients>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Save calibration coefficients for a specific rack to localStorage.
 */
export function saveCalibration(
  rackId: number,
  coefficients: Partial<CalibrationCoefficients>
) {
  const data = getStorageData();
  const existing = data[String(rackId)] || { ...EMPTY_CALIBRATION };

  data[String(rackId)] = {
    ...existing,
    ...coefficients,
  };

  setStorageData(data);
}

/**
 * Load calibration coefficients for a specific rack from localStorage.
 */
export function loadCalibration(
  rackId: number
): CalibrationCoefficients | null {
  const data = getStorageData();
  return data[String(rackId)] || null;
}

/**
 * Load all calibration data from localStorage.
 */
export function loadAllCalibrations(): Record<
  string,
  CalibrationCoefficients
> {
  return getStorageData();
}

/**
 * Clear calibration for a specific rack and sensor type.
 */
export function clearCalibration(
  rackId: number,
  sensorType: "ph" | "tds" | "all"
) {
  const data = getStorageData();
  const existing = data[String(rackId)];
  if (!existing) return;

  if (sensorType === "all") {
    delete data[String(rackId)];
  } else if (sensorType === "ph") {
    existing.ph_slope = null;
    existing.ph_offset = null;
    existing.ph_calibrated_at = null;
  } else if (sensorType === "tds") {
    existing.tds_k_factor = null;
    existing.tds_offset = null;
    existing.tds_calibrated_at = null;
  }

  setStorageData(data);
}
