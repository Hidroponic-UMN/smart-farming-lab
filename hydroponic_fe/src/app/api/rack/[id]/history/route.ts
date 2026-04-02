import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

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
    
    // Construct start_date iso string
    const startDate = getStartDateForRange(range);

    try {
        const fetchUrl = `${BACKEND_URL}/api/v1/datalogs/${id}?start_date=${encodeURIComponent(startDate)}&limit=1000`;
        const res = await fetch(fetchUrl, { cache: "no-store" });
        
        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch backend data" }, { status: res.status });
        }

        const rows: Array<{
            device_id: number;
            data_log: string;
            timestamp: string;
        }> = await res.json();

        // Target shape: { rack_id, rack_label, sensors: [ {sensor_type, label, unit, data: [{timestamp, value}]} ] }
        const sensorDataMap: Record<string, Array<{timestamp: string, value: number}>> = {};
        
        for (const row of rows) {
            try {
                const parsed = JSON.parse(row.data_log);
                const data = parsed.data || {};
                
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

        // Determine if this is a room or rack based on device_id (usually 1=room, 2-5=racks)
        // Hardcoded generic label:
        const label = Number(id) === 1 ? "Room / Ruangan Utama" : `Rack ${id}`;

        const responseData = {
            rack_id: Number(id),
            rack_label: label,
            time_range: range,
            sensors: sensors
        };

        return NextResponse.json(responseData);

    } catch (e) {
        console.error("Error in history route:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
