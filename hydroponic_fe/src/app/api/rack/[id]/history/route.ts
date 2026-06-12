import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

// Map from esp32 json key to human labels & units
const SENSOR_META: Record<string, { label: string; unit: string; sensor_type: string }> = {
    ph: { label: "pH Nutrisi", unit: "pH", sensor_type: "ph" },
    ec: { label: "EC Nutrisi", unit: "mS/cm", sensor_type: "ec" },
    water_temp: { label: "Suhu Air", unit: "°C", sensor_type: "water_temp" },
    light_intensity: { label: "Intensitas Cahaya", unit: "Lux", sensor_type: "light_intensity" },
    // Only used for room monitoring
    temperature: { label: "Suhu Ruangan", unit: "°C", sensor_type: "temperature" },
    humidity: { label: "Kelembaban", unit: "%", sensor_type: "humidity" },
};

interface DataLog {
    ec: number;
    ph: number;
    water_temp: number;
    light_intensity: number;
}

function getStartDateForRange(range: string): string {
    const d = new Date();
    switch (range) {
        case "1h": d.setHours(d.getHours() - 1); break;
        case "6h": d.setHours(d.getHours() - 6); break;
        case "24h": d.setHours(d.getHours() - 24); break;
        case "7d": d.setDate(d.getDate() - 7); break;
        default: d.setHours(d.getHours() - 1); break;
    }
    return d.toISOString();
}

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "1h";

    let startDate = "";
    let endDate = new Date().toISOString();

    if (searchParams.get("start_date") && searchParams.get("end_date")) {
        // user selected YYYY-MM-DD format from the date picker
        startDate = new Date(searchParams.get("start_date") as string).toISOString();
        const endD = new Date(searchParams.get("end_date") as string);
        endD.setHours(23, 59, 59, 999);
        endDate = endD.toISOString();
    } else {
        startDate = getStartDateForRange(range);
    }

    try {
        // Workaround: Cek device_id mana yang memiliki rack_id sesuai dengan id param. 
        // Mengingat backend hanya punya API /datalogs/{device_id}
        let deviceId = id;
        try {
            if (id === "0") {
                const latestRes = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=ROOM_MONITORING`, { cache: "no-store" });
                if (latestRes.ok) {
                    const latestRows = await latestRes.json();
                    if (latestRows.length > 0 && latestRows[0].device_id) {
                        deviceId = latestRows[0].device_id.toString();
                    } else {
                        deviceId = "1"; // Fallback to Room DB ID
                    }
                }
            } else {
                const latestRes = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=HYDROPONIC_RACKS`, { cache: "no-store" });
                if (latestRes.ok) {
                    const latestRows = await latestRes.json();
                    const rackRecord = latestRows.find((r: any) => r.rack_id === Number(id));
                    if (rackRecord && rackRecord.device_id) {
                        deviceId = rackRecord.device_id.toString();
                    } else {
                        deviceId = (Number(id) + 1).toString(); // Fallback Rack ID -> DB ID
                    }
                }
            }
        } catch (e) {
            console.error("Failed to map rack_id to device_id:", e);
        }

        const fetchUrl = `${BACKEND_URL}/api/v1/datalogs/${deviceId}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&limit=1000`;
        const res = await fetch(fetchUrl, { cache: "no-store" });

        if (!res.ok) {
            // If backend returns 404 "No data", return empty result gracefully
            if (res.status === 404) {
                const label = Number(id) === 0 ? "Room / Ruangan Utama" : `Rack ${id}`;
                return NextResponse.json({
                    rack_id: Number(id),
                    rack_label: label,
                    time_range: range,
                    sensors: []
                });
            }
            return NextResponse.json({ error: "Failed to fetch backend data" }, { status: res.status });
        }

        const rows: Array<{
            device_id: number;
            data_log: DataLog;
            timestamp: string;
        }> = await res.json();

        // Target shape: { rack_id, rack_label, sensors: [ {sensor_type, label, unit, data: [{timestamp, value}]} ] }
        const sensorDataMap: Record<string, Array<{timestamp: string, value: number}>> = {};

        for (const row of rows) {
            try {
                const parsed = row.data_log;
                const data = parsed;

                for (const [key, val] of Object.entries(data)) {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && SENSOR_META[key]) {
                        if (!sensorDataMap[key]) sensorDataMap[key] = [];
                        sensorDataMap[key].push({
                            timestamp: new Date(row.timestamp).toISOString(),
                            value: numVal
                        });
                    }
                }
            } catch (e) {
                // Ignore parse errors for individual rows
            }
        }

        // Convert to array of SensorHistory
        const sensors = Object.keys(sensorDataMap).map(key => {
            const meta = SENSOR_META[key];
            return {
                sensor_type: meta.sensor_type,
                label: meta.label,
                unit: meta.unit,
                data: sensorDataMap[key].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            };
        });

        const label = Number(id) === 0 ? "Room / Ruangan Utama" : `Rack ${id}`;

        const responseData = {
            rack_id: Number(id),
            rack_label: label,
            time_range: range,
            sensors: sensors
        };

        return NextResponse.json(responseData);

    } catch (e) {
        console.error("Error in history route:", e);
        return NextResponse.json({ error: "Internal Server Error", details: String(e) }, { status: 500 });
    }
}
