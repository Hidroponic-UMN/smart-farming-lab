"use client";

import { useState, useEffect } from "react";
import type { RackData, SystemStatus } from "./sensor-data";
import { useSimulationContext } from "./simulation-context";

interface UseRacksResult {
    racks: RackData[] | null;
    system: SystemStatus;
}

/**
 * Hook that polls GET /api/racks every 3 seconds to fetch
 * real sensor data from the backend (via the Next.js proxy route).
 */
export function useRacks(): UseRacksResult {
    const [racks, setRacks] = useState<RackData[] | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const sim = useSimulationContext();

    useEffect(() => {
        let active = true;

        async function fetchRacks() {
            if (sim.isSimulating) return; // Skip fetch if simulating

            try {
                const res = await fetch("/api/racks");
                if (!res.ok) {
                    if (active) setIsOnline(false);
                    return;
                }
                const json = await res.json();

                if (!active) return;

                if (json.racks && json.racks.length > 0) {
                    setRacks(json.racks);
                    setIsOnline(json.isOnline ?? false);
                    setLastUpdated(new Date());
                } else {
                    setIsOnline(false);
                }
            } catch {
                if (active) setIsOnline(false);
            }
        }

        fetchRacks();
        const interval = setInterval(fetchRacks, 3000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [sim.isSimulating]);

    if (sim.isSimulating && sim.simulatedData) {
        return {
            racks: sim.simulatedData.racks,
            system: sim.simulatedData.system,
        };
    }

    const system: SystemStatus = {
        esp32Online: isOnline,
        serverOnline: isOnline,
        lastUpdated,
    };

    return { racks, system };
}
