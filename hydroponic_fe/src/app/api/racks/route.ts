import { NextResponse } from "next/server";
import { getStatus } from "@/lib/thresholds";

const HISTORY_LENGTH = 25;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
const OFFLINE_TIMEOUT_MS = 15_000; // 15 seconds

// --- Key mapping: ESP32 snake_case → frontend camelCase ---
const SENSOR_MAP: Record<string, { feKey: string; thresholdType: string }> = {
    ph: { feKey: "ph", thresholdType: "ph" },
    ec: { feKey: "ec", thresholdType: "ec" },
    water_temp: { feKey: "waterTemp", thresholdType: "waterTemp" },
    water_level: { feKey: "waterLevel", thresholdType: "waterLevel" },
    water_flow: { feKey: "waterFlow", thresholdType: "waterFlow" },
    light_intensity: { feKey: "lightIntensity", thresholdType: "lightIntensity" },
};

// --- In-memory store (resets on server restart) ---
interface SensorStore {
    value: number;
    history: number[];
}

interface RackStore {
    sensors: Record<string, SensorStore>;
    rackId: number;
    lastUpdated: Date | null;
}

// Map of device_id → RackStore
const store: Map<number, RackStore> = new Map();

function getOrCreateRack(deviceId: number, rackId: number): RackStore {
    if (!store.has(deviceId)) {
        store.set(deviceId, {
            sensors: {},
            rackId,
            lastUpdated: null,
        });
    }
    const rack = store.get(deviceId)!;
    rack.rackId = rackId;
    return rack;
}

function updateSensor(rack: RackStore, sensorKey: string, value: number) {
    if (!rack.sensors[sensorKey]) {
        rack.sensors[sensorKey] = { value: 0, history: [] };
    }
    const sensor = rack.sensors[sensorKey];
    sensor.value = value;
    sensor.history = [...sensor.history.slice(-(HISTORY_LENGTH - 1)), value];
}

// --- Build the response in RackData shape ---
function buildRackResponse(deviceId: number, rack: RackStore) {
    const sensors: Record<string, unknown> = {};

    for (const [espKey, { feKey, thresholdType }] of Object.entries(SENSOR_MAP)) {
        const s = rack.sensors[feKey];
        if (s) {
            sensors[feKey] = {
                value: s.value,
                history: s.history,
                status: getStatus(s.value, thresholdType),
            };
        } else {
            // Sensor not yet received — provide a safe placeholder
            sensors[feKey] = {
                value: 0,
                history: [],
                status: "Normal",
            };
        }
    }

    // Compute overall status
    const statuses = Object.values(sensors).map(
        (s: any) => s.status as string
    );
    let overallStatus = "Normal";
    if (statuses.includes("Critical")) overallStatus = "Critical";
    else if (statuses.some((s) => s === "Low" || s === "High" || s === "Warning"))
        overallStatus = "Warning";

    return {
        id: rack.rackId,
        label: `Rack ${rack.rackId}`,
        ...sensors,
        overallStatus,
    };
}

/**
 * GET /api/racks
 *
 * 1. Fetches latest sensor data from the backend  (GET /api/v1/datalogs/latest)
 * 2. Accumulates history in-memory
 * 3. Returns data shaped as RackData[] for the dashboard
 */
export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=HYDROPONIC_RACKS`, {
            cache: "no-store",
        });

        if (res.ok) {
            const rows: Array<{
                device_id: number;
                data_log: string;
                timestamp: string;
            }> = await res.json();

            // Update in-memory store with fresh data
            for (const row of rows) {
                // The frontend expects rackId 1-5, which maps nicely to device_id 1-5 
                // However, since Room is often 1, maybe racks are 2-6? 
                // Note: using device_id directly as rackId for now.
                const rack = getOrCreateRack(row.device_id, row.device_id);
                rack.lastUpdated = new Date();

                try {
                    const parsed = JSON.parse(row.data_log);
                    const sensorData = parsed.data || {};
                    for (const [espKey, { feKey }] of Object.entries(SENSOR_MAP)) {
                        if (sensorData[espKey] !== undefined) {
                            updateSensor(rack, feKey, Number(sensorData[espKey]));
                        }
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
        }
    } catch (e) {
        // Backend unreachable — we still return whatever we have in store
        console.error("Failed to fetch from backend:", e);
    }

    // Ensure all 5 racks always exist in the store (for 0-value fallback)
    for (let i = 1; i <= 5; i++) {
        getOrCreateRack(i, i);
    }

    // Build response from store
    const now = new Date();
    const racks = Array.from(store.entries())
        .map(([deviceId, rack]) => buildRackResponse(deviceId, rack))
        .sort((a, b) => a.id - b.id);

    const isOnline =
        racks.length > 0 &&
        Array.from(store.values()).some(
            (r) =>
                r.lastUpdated !== null &&
                now.getTime() - r.lastUpdated.getTime() < OFFLINE_TIMEOUT_MS
        );

    return NextResponse.json({
        racks,
        isOnline,
        lastUpdated: isOnline ? now.toISOString() : null,
    });
}
