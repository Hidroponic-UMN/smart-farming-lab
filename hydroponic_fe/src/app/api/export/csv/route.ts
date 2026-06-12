import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rackId = searchParams.get("rack_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let deviceId: string | null = null;

    if (rackId !== null) {
        // resolve deviceId
        try {
            if (rackId === "0") {
                const latestRes = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=ROOM_MONITORING`, { cache: "no-store" });
                if (latestRes.ok) {
                    const latestRows = await latestRes.json();
                    if (latestRows.length > 0 && latestRows[0].device_id) {
                        deviceId = latestRows[0].device_id.toString();
                    } else {
                        deviceId = "1";
                    }
                }
            } else {
                const latestRes = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=HYDROPONIC_RACKS`, { cache: "no-store" });
                if (latestRes.ok) {
                    const latestRows = await latestRes.json();
                    const rackRecord = latestRows.find((r: any) => r.rack_id === Number(rackId));
                    if (rackRecord && rackRecord.device_id) {
                        deviceId = rackRecord.device_id.toString();
                    } else {
                        deviceId = (Number(rackId) + 1).toString();
                    }
                }
            }
        } catch (e) {
            console.error("Failed to map rack_id to device_id:", e);
        }
    }

    let fetchUrl = "";
    if (deviceId !== null) {
        fetchUrl = `${BACKEND_URL}/api/v1/datalogs/export/csv/${deviceId}`;
    } else {
        fetchUrl = `${BACKEND_URL}/api/v1/datalogs/exports/csv`;
    }

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set("start_date", startDate);
    if (endDate) queryParams.set("end_date", endDate);
    // Add limit 1000 so it matches UI range conceptually
    queryParams.set("limit", "10000");

    const q = queryParams.toString();
    if (q) {
        fetchUrl += `?${q}`;
    }

    try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch CSV from backend" }, { status: res.status });
        }

        const data = await res.text();
        const response = new NextResponse(data);
        response.headers.set("Content-Type", "text/csv");
        response.headers.set("Content-Disposition", `attachment; filename="smart_farming_export_${rackId ?? "all"}_${new Date().toISOString().split('T')[0]}.csv"`);
        return response;
    } catch (error) {
        console.error("Error downloading CSV:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
