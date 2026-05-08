import { NextResponse } from "next/server";
import { getStatus } from "@/lib/thresholds";

const HISTORY_LENGTH = 25;
const OFFLINE_TIMEOUT_MS = 15000; // 15 seconds
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

interface SensorStore {
    value: number;
    history: number[];
}

interface DataLog {
    temperature: number;
    humidity: number;
}

// In-memory store (resets on server restart)
let store: {
    temperature: SensorStore;
    humidity: SensorStore;
    lastUpdated: Date | null;
} = {
    temperature: { value: 0, history: [] },
    humidity: { value: 0, history: [] },
    lastUpdated: null,
};



/**
 * GET /api/room
 * Returns latest room sensor data from the backend.
 */
export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=ROOM_MONITORING`, {
            cache: "no-store",
        });

        if (res.ok) {
            const rows: Array<{
                device_id: number;
                data_log: DataLog;
                timestamp: string;
            }> = await res.json();

            // Typically there is only one room monitoring device.
            // We'll take the first one found.
            for (const row of rows) {
                try {
                    const parsed = row.data_log;
                    const sensorData = parsed;

                    if (sensorData.temperature !== undefined) {
                        const tempValue = Number(sensorData.temperature);
                        if (!isNaN(tempValue)) {
                            store.temperature.value = tempValue;
                            store.temperature.history = [
                                ...store.temperature.history.slice(-(HISTORY_LENGTH - 1)),
                                tempValue,
                            ];
                        }
                    }

                    if (sensorData.humidity !== undefined) {
                        const humValue = Number(sensorData.humidity);
                        if (!isNaN(humValue)) {
                            store.humidity.value = humValue;
                            store.humidity.history = [
                                ...store.humidity.history.slice(-(HISTORY_LENGTH - 1)),
                                humValue,
                            ];
                        }
                    }

                    store.lastUpdated = new Date();
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch room data from backend:", e);
    }

    const now = new Date();
    const esp32Online =
        store.lastUpdated !== null &&
        now.getTime() - store.lastUpdated.getTime() < OFFLINE_TIMEOUT_MS;

    // If no data has been received yet
    if (!store.lastUpdated) {
        return NextResponse.json({
            temperature: null,
            humidity: null,
            lastUpdated: null,
            esp32Online: false,
        });
    }

    return NextResponse.json({
        temperature: {
            value: store.temperature.value,
            history: store.temperature.history,
            status: getStatus(store.temperature.value, "roomTemp"),
        },
        humidity: {
            value: store.humidity.value,
            history: store.humidity.history,
            status: getStatus(store.humidity.value, "roomHumidity"),
        },
        lastUpdated: store.lastUpdated.toISOString(),
        esp32Online,
    });
}
