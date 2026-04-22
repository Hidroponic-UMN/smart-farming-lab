import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

/**
 * GET /api/calibration/[rackId]/status?command_type=KALIBRASI_PH
 *
 * Polls the latest command log for a specific rack and command type.
 * Used by the frontend to check if ESP32 has ACK'd a calibration command.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rackId: string }> }
) {
  const { rackId } = await params;
  const commandType = request.nextUrl.searchParams.get("command_type");

  try {
    // Fetch latest command logs for this device type
    const res = await fetch(
      `${BACKEND_URL}/api/v1/commandlogs/latest?device_type=HYDROPONIC_RACKS`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { status: "PENDING", message: "Backend unavailable" },
        { status: 200 }
      );
    }

    const logs: Array<{
      command_id: number;
      status_id: number;
      device_id: number;
      cmd_log: Record<string, unknown>;
      timestamp: string;
      rack_id: number;
    }> = await res.json();

    // Find the latest log for this rack
    const rackLogs = logs.filter((l) => l.rack_id === parseInt(rackId));
    if (rackLogs.length === 0) {
      return NextResponse.json({ status: "PENDING" });
    }

    // Get command type and status mappings
    const [typesRes, statusesRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/generals/commandtypes`, {
        cache: "no-store",
      }),
      fetch(`${BACKEND_URL}/api/v1/generals/commandstatus`, {
        cache: "no-store",
      }),
    ]);

    let statusMap: Record<number, string> = {};
    let typeMap: Record<number, string> = {};

    if (typesRes.ok) {
      const types: Array<{ id: number; desc: string }> =
        await typesRes.json();
      for (const t of types) {
        typeMap[t.id] = t.desc;
      }
    }
    if (statusesRes.ok) {
      const statuses: Array<{ id: number; desc: string }> =
        await statusesRes.json();
      for (const s of statuses) {
        statusMap[s.id] = s.desc;
      }
    }

    // Find matching log
    const latest = rackLogs[0]; // Already sorted by latest
    const cmdName = typeMap[latest.command_id] || "";
    const statusName = statusMap[latest.status_id] || "PENDING";

    // Check if this log matches the requested command type
    if (commandType && cmdName !== commandType) {
      return NextResponse.json({ status: "PENDING" });
    }

    return NextResponse.json({
      status: statusName,
      command: cmdName,
      cmd_log: latest.cmd_log,
      timestamp: latest.timestamp,
    });
  } catch {
    return NextResponse.json({ status: "PENDING" });
  }
}
