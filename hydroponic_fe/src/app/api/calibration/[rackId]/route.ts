import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/calibration/[rackId]
 * POST /api/calibration/[rackId]
 *
 * Per-rack calibration coefficient management.
 *
 * Currently a placeholder — calibration data lives in client-side localStorage.
 * When the backend team adds the calibration endpoint, switch to proxying:
 *   GET  /api/v1/calibration/{device_id}
 *   POST /api/v1/calibration/{device_id}
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ rackId: string }> }
) {
  const { rackId } = await params;

  // TODO: Proxy to backend when ready
  // const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
  // const res = await fetch(`${BACKEND_URL}/api/v1/calibration/${rackId}`, { cache: "no-store" });
  // if (res.ok) return NextResponse.json(await res.json());

  return NextResponse.json({
    rackId: parseInt(rackId),
    message: "Calibration data managed client-side via localStorage",
    calibration: null,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rackId: string }> }
) {
  const { rackId } = await params;

  try {
    const body = await request.json();

    // TODO: Proxy to backend when ready
    // const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
    // const res = await fetch(`${BACKEND_URL}/api/v1/calibration/${rackId}`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(body),
    // });
    // if (res.ok) return NextResponse.json(await res.json());

    return NextResponse.json({
      rackId: parseInt(rackId),
      message: "Calibration saved (client-side). Backend integration pending.",
      calibration: body,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
