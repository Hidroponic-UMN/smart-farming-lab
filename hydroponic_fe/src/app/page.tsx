"use client";

import { useRacks } from "@/lib/use-racks";
import { useRoomSensor } from "@/lib/simulation";
import { useNotifications } from "@/lib/notifications";
import { TopNavbar } from "@/components/top-navbar";
import { RoomMonitor } from "@/components/room-monitor";
import { RackCard } from "@/components/rack-card";
// import { SummaryPanel } from "@/components/summary-panel"; // hidden as requested
// Import backgrounds
import bgTop from "@/assets/images/bgsmartfarmingtop.avif";
import bgBot from "@/assets/images/bgsmartfarmingbot.avif";

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
    <div className="h-screen w-screen relative overflow-hidden flex flex-col font-sans">
      {/* Background Section Bottom (Green Field) */}
      <div
        className="absolute bottom-0 left-0 w-full h-[55%] bg-cover bg-center z-0 opacity-80"
        style={{ backgroundImage: `url(${bgBot.src})` }}
      />

      {/* Background Section Top (Garden) */}
      <div
        className="absolute top-0 left-0 w-full h-[45%] bg-cover bg-center z-0 rounded-b-[30px] overflow-hidden"
        style={{ backgroundImage: `url(${bgTop.src})` }}
      >
        {/* Soft overlay to blend top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex-1 flex flex-col p-10 overflow-hidden">

        {/* Header Section: Welcome (Left) | Navbar (Right) */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h1 className="text-4xl font-semibold text-[#34473d] tracking-tight leading-tight">
              Welcome to
            </h1>
            <h1 className="text-[52px] font-bold text-[#34473d] tracking-tight leading-none">
              Lab Smart Farming
            </h1>
            <p className="text-xl text-[#34473d]/70 font-medium mt-3">
              {criticalCount > 0 ? (
                <span className="text-red-600 italic">Attention required on some racks!</span>
              ) : (
                "All System Working Normally"
              )}
            </p>

            {/* Room Monitoring - Placed below Welcome */}
            <div className="pt-10 w-[520px]">
              <RoomMonitor
                temperature={roomTemperature}
                humidity={roomHumidity}
              />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <TopNavbar
              system={{ ...system, esp32Online: esp32Online || system.esp32Online }}
              warningCount={warningCount}
              criticalCount={criticalCount}
              notifications={notifications.notifications}
              unreadCount={notifications.unreadCount}
              onMarkAllRead={notifications.markAllRead}
              onClearAll={notifications.clearAll}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-4">
          {/* Row 2: Rack Cards */}
          <div className="grid grid-cols-5 gap-4 min-h-0">
            {displayRacks.map((rack) => (
              <RackCard key={rack.id} rack={rack} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
