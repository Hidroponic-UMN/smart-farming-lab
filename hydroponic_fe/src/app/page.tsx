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
    <div className="min-h-screen w-screen relative overflow-x-hidden flex flex-col font-sans bg-[#ece9e5]">
      {/* Background Section Bottom (Green Field) - Positioned at the very bottom of the page */}
      <div
        className="absolute bottom-0 left-0 w-full h-[50vh] bg-cover bg-bottom z-0 opacity-60"
        style={{ 
          backgroundImage: `url(${bgBot.src})`,
          maskImage: 'linear-gradient(to bottom, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)'
        }}
      />

      {/* Background Section Top (Garden) - Fixed height on top */}
      <div
        className="absolute top-0 left-0 w-full h-[600px] md:h-[500px] bg-cover bg-center z-0 rounded-b-[30px] overflow-hidden"
        style={{ backgroundImage: `url(${bgTop.src})` }}
      >
        {/* Soft overlay to blend top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5" />
      </div>

      {/* Main content container - Scrollable */}
      <div className="relative z-10 flex-1 flex flex-col p-4 md:p-10 overflow-visible">

        {/* Header Section: Welcome text & Navbar (Top) | Room Monitor (Below) */}
        <div className="flex flex-col gap-6 md:gap-8 mb-8">
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-semibold text-[#34473d] tracking-tight leading-tight">
                Welcome to
              </h1>
              <h1 className="text-3xl md:text-[52px] font-bold text-[#34473d] tracking-tight leading-none">
                Lab Smart Farming
              </h1>
              <p className="text-base md:text-xl text-[#34473d]/70 font-medium mt-2 md:mt-3">
                {criticalCount > 0 ? (
                  <span className="text-red-600 italic">Attention required on some racks!</span>
                ) : (
                  "All System Working Normally"
                )}
              </p>
            </div>

            <div className="flex justify-end pt-1">
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

          {/* Room Monitoring - Now spanning below the header row */}
          <div className="w-full max-w-[550px]">
            <RoomMonitor
              temperature={roomTemperature}
              humidity={roomHumidity}
            />
          </div>
        </div>

        <div className="mt-8">
          {/* Row 2: Rack Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {displayRacks.map((rack) => (
              <RackCard key={rack.id} rack={rack} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
