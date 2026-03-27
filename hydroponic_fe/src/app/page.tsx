"use client";

import { useRacks } from "@/lib/use-racks";
import { useRoomSensor } from "@/lib/simulation";
import { useNotifications } from "@/lib/notifications";
import { Header } from "@/components/header";
import { RoomMonitor } from "@/components/room-monitor";
import { RackCard } from "@/components/rack-card";
import { SummaryPanel } from "@/components/summary-panel";

export default function Dashboard() {
  const { racks, system } = useRacks();
  const { roomData, esp32Online } = useRoomSensor();
  const notifications = useNotifications(
    racks
      ? {
          room: {
            temperature: roomData?.temperature ?? { value: 0, history: [], status: "Normal" as const },
            humidity: roomData?.humidity ?? { value: 0, history: [], status: "Normal" as const },
          },
          racks,
          system,
        }
      : null
  );

  // Use real API data for room if available
  const roomTemperature = roomData?.temperature ?? { value: 0, history: [], status: "Normal" as const };
  const roomHumidity = roomData?.humidity ?? { value: 0, history: [], status: "Normal" as const };

  const displayRacks = racks || [];

  const warningCount = displayRacks.filter(
    (r) =>
      r.overallStatus === "Warning" ||
      r.overallStatus === "Low" ||
      r.overallStatus === "High"
  ).length;
  const criticalCount = displayRacks.filter(
    (r) => r.overallStatus === "Critical"
  ).length;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col gap-3 p-4 min-h-0 m-10">
        {/* Greeting Banner */}
        <div className="flex flex-col items-center text-center flex-shrink-0 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome to Lab Smart Farming
          </h2>
          {criticalCount > 0 ? (
            <span className="text-lg font-medium text-red-500 mt-1">
              {criticalCount} rack{criticalCount > 1 ? "s" : ""} need{criticalCount === 1 ? "s" : ""} attention!
            </span>
          ) : warningCount > 0 ? (
            <span className="text-lg font-medium text-amber-500 mt-1">
              {warningCount} rack{warningCount > 1 ? "s" : ""} in warning state
            </span>
          ) : (
            <span className="text-lg font-medium text-emerald-500 mt-1">
              All Systems Operating Normally
            </span>
          )}
        </div>

        {/* Row 1: Room Monitoring + Summary */}
        <div className="flex gap-4 flex-shrink-0 items-stretch">
          <div className="flex-1 flex">
            <div className="w-full">
              <RoomMonitor
                temperature={roomTemperature}
                humidity={roomHumidity}
              />
            </div>
          </div>
          <div className="flex-1 flex">
            <div className="w-full">
              <SummaryPanel racks={displayRacks} />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t-2 border-muted my-3" />
        {/* Row 2: Rack Cards */}
        <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
          {displayRacks.map((rack) => (
            <RackCard key={rack.id} rack={rack} />
          ))}
        </div>
      </div>

      {/* Floating Bottom Header */}
      <Header
        system={{ ...system, esp32Online: esp32Online || system.esp32Online }}
        warningCount={warningCount}
        criticalCount={criticalCount}
        notifications={notifications.notifications}
        unreadCount={notifications.unreadCount}
        onMarkAllRead={notifications.markAllRead}
        onClearAll={notifications.clearAll}
      />
    </div>
  );
}
