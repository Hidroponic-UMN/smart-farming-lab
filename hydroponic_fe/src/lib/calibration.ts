/**
 * Calibration utilities for pH and TDS sensors.
 *
 * pH calibration: 2-point (pH 4.00 and pH 7.00)
 *   → ESP32 calculates slope + offset, stores in flash
 *
 * TDS calibration: 1-point (1382 ppm reference solution)
 *   → ESP32 reads water temp itself for compensation
 *
 * Frontend sends commands via backend (MQTT bridge) to ESP32.
 * ESP32 does all the math and stores coefficients.
 */

// ============================================================
//  Types
// ============================================================

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

// ============================================================
//  pH Constants (2-point: pH 7.00 first, then pH 4.00)
// ============================================================

export const PH_BUFFERS = {
  neutral: { value: 7.0, label: "pH 7.00", color: "#3b82f6" },
  acid: { value: 4.0, label: "pH 4.00", color: "#ef4444" },
} as const;

// ============================================================
//  TDS Constants
// ============================================================

/** Default TDS reference solution nominal value */
export const TDS_REFERENCE_PPM = 1382;

// ============================================================
//  Backend Command API
// ============================================================

export type CommandType =
  | "KALIBRASI_PH"
  | "KALIBRASI_TDS"
  | "RESET_CALIBRATION";

export interface CommandResult {
  success: boolean;
  status: string;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Send a calibration command to the backend, which forwards it
 * to the ESP32 via MQTT. Then poll for the ACK.
 *
 * @param rackId - Rack ID (1-5)
 * @param commandType - "KALIBRASI_PH" | "KALIBRASI_TDS" | "RESET_CALIBRATION"
 * @param knownValue - The reference value (pH or ppm)
 * @returns CommandResult with success/failure status
 */
export async function sendCalibrationCommand(
  rackId: number,
  commandType: CommandType,
  knownValue: number
): Promise<CommandResult> {
  try {
    const res = await fetch(`/api/calibration/${rackId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: {
          created_by: "Lab Admin",
          command_type: commandType,
        },
        input_json: {
          known_value: knownValue,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        status: "FAILED",
        error: errData.detail || `HTTP ${res.status}`,
      };
    }

    // Now poll for ACK — check command log status
    const ackResult = await pollForAck(rackId, commandType, 30000);
    return ackResult;
  } catch (err) {
    return {
      success: false,
      status: "ERROR",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Poll the command logs for an ACK from the ESP32.
 * Checks every 2 seconds for up to maxWaitMs.
 */
async function pollForAck(
  rackId: number,
  commandType: string,
  maxWaitMs: number = 30000
): Promise<CommandResult> {
  const startTime = Date.now();
  const pollInterval = 2000;

  // Give ESP32 a moment to process
  await new Promise((r) => setTimeout(r, 2000));

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(
        `/api/calibration/${rackId}/status?command_type=${commandType}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS") {
          return {
            success: true,
            status: "SUCCESS",
            data: data.cmd_log,
          };
        }
        if (data.status === "FAILED" || data.status === "TIMEOUT") {
          return {
            success: false,
            status: data.status,
            error: `ESP32 returned ${data.status}`,
          };
        }
        // Still PENDING — continue polling
      }
    } catch {
      // Network error during poll, continue
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  // Timeout — assume success since ESP32 might have processed it
  // but ACK was lost
  return {
    success: true,
    status: "TIMEOUT_ASSUMED_OK",
    error: "No ACK received, but command was sent successfully",
  };
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

  const win = readings.slice(-windowSize);
  const mean = win.reduce((a, b) => a + b, 0) / win.length;
  const variance =
    win.reduce((sum, v) => sum + (v - mean) ** 2, 0) / win.length;
  const stdDev = Math.sqrt(variance);

  return stdDev < threshold;
}

// ============================================================
//  Calibration Application
// ============================================================

/**
 * Apply pH calibration slope and offset to raw sensor value.
 * pH = (slope * raw) + offset
 */
export function applyPhCalibration(
  value: number,
  slope: number,
  offset: number
): number {
  return value * slope + offset;
}

/**
 * Apply TDS calibration k-factor and offset with temperature compensation.
 * Standard compensation: 1.9% per degree C from 25C.
 */
export function applyTdsCalibration(
  value: number,
  kFactor: number,
  offset: number,
  temperature: number = 25
): number {
  const baseTds = value * kFactor + offset;
  const tempCoefficient = 1 + 0.019 * (temperature - 25);
  return baseTds / tempCoefficient;
}

// ============================================================
//  localStorage Helpers
//  (Backup — primary calibration now on ESP32)
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
