import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // proxy to backend
        const res = await fetch(`${BACKEND_URL}/api/v1/datalogs/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        return NextResponse.json(
            { detail: "Failed to send simulated data to backend" },
            { status: 502 }
        );
    }
}
