import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const body = await request.json();

        let deviceId = id;
        try {
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
        } catch (e) {
            console.error("Failed to map rack_id to device_id:", e);
        }

        const res = await fetch(`${BACKEND_URL}/api/v1/generals/devices/${deviceId}/planted-date`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ planted_at: body.planted_at }),
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to update planted date" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        console.error("Error setting planted date:", e);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
