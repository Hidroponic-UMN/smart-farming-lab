"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable, getCoreRowModel, getPaginationRowModel, flexRender,
  createColumnHelper, type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, ChevronLeft, ChevronRight,
  Database, RefreshCw, LogOut
} from "lucide-react";

export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface BackendRow {
  id?: number;
  device_id: number;
  data_log: string;
  timestamp: string;
}

// Flat representation for our table
interface ReadingRow {
  id: string; // we'll artificially create one if not provided
  device_id: number;
  // Dynamic fields from JSON parsing
  temperature?: number | string;
  humidity?: number | string;
  ph?: number | string;
  ec?: number | string;
  light_intensity?: number | string;
  water_temp?: number | string;
  water_level?: number | string;
  water_flow?: number | string;
  timestamp: string;
  mac_addr?: string;
}

const DEVICE_TYPES = [
  { value: "", label: "Semua Tipe Device" },
  { value: "ROOM_MONITORING", label: "Ruangan (Room Monitoring)" },
  { value: "HYDROPONIC_RACKS", label: "Rak (Hydroponic Racks)" }
];

const DEVICE_LABELS: Record<number, string> = {
  1: "Room / Ruangan Utama",
  2: "Rack 1",
  3: "Rack 2",
  4: "Rack 3",
  5: "Rack 4",
};

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function parseDataLog(dataLogStr: string, deviceId: number, timestamp: string, index: number): ReadingRow {
  const row: ReadingRow = {
    id: `${deviceId}-${index}-${timestamp}`,
    device_id: deviceId,
    timestamp: timestamp,
  };

  try {
    const parsed = JSON.parse(dataLogStr);
    row.mac_addr = parsed.mac_addr;
    
    // Extrack "data" payload
    if (parsed.data) {
      if (parsed.data.temperature !== undefined) row.temperature = parsed.data.temperature;
      if (parsed.data.humidity !== undefined) row.humidity = parsed.data.humidity;
      if (parsed.data.ph !== undefined) row.ph = parsed.data.ph;
      if (parsed.data.ec !== undefined) row.ec = parsed.data.ec;
      if (parsed.data.light_intensity !== undefined) row.light_intensity = parsed.data.light_intensity;
      if (parsed.data.water_temp !== undefined) row.water_temp = parsed.data.water_temp;
    }
  } catch (e) {
    // Silently ignore JSON parse errors and return basic row
  }

  return row;
}

export default function DataPage() {
  const router = useRouter();
  const [tableData, setTableData] = useState<ReadingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceType, setDeviceType] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);



  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (deviceType) params.set("device_type", deviceType);

      const res = await fetch(`${BACKEND_URL}/api/v1/datalogs/?${params}`);
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: BackendRow[] = await res.json();
      
      // Parse JSON
      const parsedRows = json.map((row, index) => parseDataLog(row.data_log, row.device_id, row.timestamp, index));
      setTableData(parsedRows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deviceType, limit]);

  const handleExport = () => {
    // The backend endpoint is: /api/v1/datalogs/exports/{file_type}
    const params = new URLSearchParams();
    if (deviceType) params.set("device_type", deviceType);
    
    // Direct link to download via backend API
    const url = `${BACKEND_URL}/api/v1/datalogs/exports/csv?${params.toString()}`;
    
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank"; // Provide fallback behavior
    a.click();
  };



  // Determine which columns to show dynamically based on data or selected type
  const columns = useMemo<ColumnDef<ReadingRow, any>[]>(() => {
    const isRoom = deviceType === "ROOM_MONITORING";
    const isRack = deviceType === "HYDROPONIC_RACKS";
    const showAll = !deviceType;

    const baseCols: ColumnDef<ReadingRow, any>[] = [
      {
        accessorKey: "device_id",
        header: "Device / Rack",
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <Badge variant="outline" className="text-xs font-mono">
              {DEVICE_LABELS[val] || `Device ${val}`}
            </Badge>
          );
        },
      },
      {
        accessorKey: "mac_addr",
        header: "MAC Address",
        cell: (info) => <span className="text-xs font-mono text-muted-foreground">{info.getValue() || '-'}</span>,
      }
    ];

    const sensorCols: ColumnDef<ReadingRow, any>[] = [];

    if (showAll || isRoom) {
      sensorCols.push(
        {
          accessorKey: "temperature",
          header: "Suhu Udara (°C)",
          cell: (info) => <span className="text-sm font-semibold text-orange-400">{info.getValue() || '-'}</span>,
        },
        {
          accessorKey: "humidity",
          header: "Kelembaban (%)",
          cell: (info) => <span className="text-sm font-semibold text-blue-400">{info.getValue() || '-'}</span>,
        }
      );
    }

    if (showAll || isRack) {
      sensorCols.push(
        {
          accessorKey: "ph",
          header: "pH Nutrisi",
          cell: (info) => <span className="text-sm font-semibold text-purple-400">{info.getValue() || '-'}</span>,
        },
        {
          accessorKey: "ec",
          header: "EC Nutrisi",
          cell: (info) => <span className="text-sm font-semibold text-yellow-500">{info.getValue() || '-'}</span>,
        },
        {
          accessorKey: "water_temp",
          header: "Suhu Air (°C)",
          cell: (info) => <span className="text-sm font-semibold text-cyan-400">{info.getValue() || '-'}</span>,
        },
        {
          accessorKey: "light_intensity",
          header: "Intensitas Cahaya",
          cell: (info) => <span className="text-sm font-semibold text-amber-300">{info.getValue() || '-'}</span>,
        }
      );
    }

    const endCols: ColumnDef<ReadingRow, any>[] = [
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: (info) => (
          <span className="text-xs text-muted-foreground">{formatTimestamp(info.getValue() as string)}</span>
        ),
      }
    ];

    return [...baseCols, ...sensorCols, ...endCols];
  }, [deviceType]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 }
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-1">
              <ArrowLeft className="size-4" /> Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <Database className="size-4 text-emerald-500" />
            <h1 className="text-lg font-bold hidden sm:block">Database Viewer</h1>
            {tableData && (
              <Badge variant="outline" className="text-xs font-mono">
                {tableData.length.toLocaleString()} records
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
              <RefreshCw className="size-3" /> <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="default" size="sm" onClick={handleExport} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <Download className="size-3" /> <span className="hidden sm:inline">Download CSV</span>
            </Button>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Filter Tipe Device:</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {DEVICE_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-muted-foreground">Memuat data histori...</span>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Tidak ada data log yang tersimpan di backend.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2.5 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">
              Menampilkan {table.getRowModel().rows.length} baris di halaman {table.getState().pagination.pageIndex + 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
