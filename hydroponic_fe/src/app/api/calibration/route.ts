import { NextResponse } from "next/server";

/**
 * GET /api/calibration
 *
 * Returns all calibration coefficients for all racks.
 * Currently reads from a simple in-memory/localStorage approach.
 *
 * TODO: Switch to backend API when endpoint is ready:
 *   GET /api/v1/calibration
 */
export async function GET() {
  // For now, return empty — calibration data is managed client-side via localStorage.
  // When backend endpoint is ready, proxy to it:
  //
  // const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
  // const res = await fetch(`${BACKEND_URL}/api/v1/calibration`, { cache: "no-store" });
  // if (res.ok) return NextResponse.json(await res.json());

  return NextResponse.json({
    message:
      "Calibration data is currently managed client-side. Use /api/calibration/[rackId] for per-rack data.",
    calibrations: {},
  });
}
