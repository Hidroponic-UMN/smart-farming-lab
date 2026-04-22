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

/**
 * pH buffer temperature compensation tables.
 * Key = nominal pH value, Array = {temp °C, actual pH value}
 */
export const PH_TEMP_TABLE: Record<string, { temp: number; value: number }[]> =
  {
    "4.01": [
      { temp: 10, value: 4.0 },
      { temp: 15, value: 4.0 },
      { temp: 20, value: 4.0 },
      { temp: 25, value: 4.01 },
      { temp: 30, value: 4.01 },
      { temp: 35, value: 4.02 },
      { temp: 40, value: 4.03 },
      { temp: 45, value: 4.04 },
      { temp: 50, value: 4.06 },
    ],
    "6.86": [
      { temp: 10, value: 6.92 },
      { temp: 15, value: 6.9 },
      { temp: 20, value: 6.88 },
      { temp: 25, value: 6.86 },
      { temp: 30, value: 6.85 },
      { temp: 35, value: 6.84 },
      { temp: 40, value: 6.84 },
      { temp: 45, value: 6.83 },
      { temp: 50, value: 6.83 },
    ],
    "9.18": [
      { temp: 10, value: 9.33 },
      { temp: 15, value: 9.28 },
      { temp: 20, value: 9.23 },
      { temp: 25, value: 9.18 },
      { temp: 30, value: 9.14 },
      { temp: 35, value: 9.1 },
      { temp: 40, value: 9.07 },
      { temp: 45, value: 9.04 },
      { temp: 50, value: 9.02 },
    ],
  };

// ============================================================
//  TDS Reference Solution & Temperature Compensation
// ============================================================

/** Default TDS reference solution nominal value */
export const TDS_REFERENCE_PPM = 1382;

/**
 * TDS 1382 ppm solution temperature compensation table.
 * {temp °C, actual ppm at that temperature}
 */
export const TDS_TEMP_TABLE: { temp: number; value: number }[] = [
  { temp: 0, value: 758 },
  { temp: 5, value: 876 },
  { temp: 10, value: 999 },
  { temp: 15, value: 1122 },
  { temp: 20, value: 1251 },
  { temp: 23, value: 1329 },
  { temp: 24, value: 1358 },
  { temp: 25, value: 1382 },
  { temp: 26, value: 1408 },
  { temp: 30, value: 1515 },
];

// ============================================================
//  Temperature Compensation Lookup
// ============================================================

/**
 * Linear interpolation of known_value based on measured water temperature.
 * Uses the closest two points from the temperature table.
 */
export function lookupTempCompensated(
  table: { temp: number; value: number }[],
  waterTemp: number
): number {
  if (table.length === 0) return 0;

  // Clamp to table range
  if (waterTemp <= table[0].temp) return table[0].value;
  if (waterTemp >= table[table.length - 1].temp)
    return table[table.length - 1].value;

  // Find surrounding points
  for (let i = 0; i < table.length - 1; i++) {
    if (waterTemp >= table[i].temp && waterTemp <= table[i + 1].temp) {
      const t0 = table[i].temp;
      const t1 = table[i + 1].temp;
      const v0 = table[i].value;
      const v1 = table[i + 1].value;

      // Linear interpolation
      const ratio = (waterTemp - t0) / (t1 - t0);
      return Math.round((v0 + ratio * (v1 - v0)) * 100) / 100;
    }
  }

  return table[0].value;
}

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
 * @param knownValue - The temperature-compensated reference value
 * @param waterTemp - Measured water temperature in °C
 * @returns CommandResult with success/failure status
 */
export async function sendCalibrationCommand(
  rackId: number,
  commandType: CommandType,
  knownValue: number,
  waterTemp?: number
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
          ...(waterTemp != null ? { water_temp: waterTemp } : {}),
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

    const data = await res.json();

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

  const window = readings.slice(-windowSize);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance =
    window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window.length;
  const stdDev = Math.sqrt(variance);

  return stdDev < threshold;
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
