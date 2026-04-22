import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

/**
 * POST /api/calibration/[rackId]/command
 *
 * Proxies calibration commands to the backend commandlogs endpoint.
 * Backend then publishes to MQTT → ESP32 executes calibration.
 *
 * Request body:
 * {
 *   "command": { "created_by": "Lab Admin", "command_type": "KALIBRASI_PH" },
 *   "input_json": { "known_value": 6.86, "water_temp": 25.0 }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rackId: string }> }
) {
  const { rackId } = await params;

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/commandlogs/${rackId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: "Failed to send calibration command to backend" },
      { status: 502 }
    );
  }
}
