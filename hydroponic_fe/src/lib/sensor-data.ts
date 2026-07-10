"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getStatus, type Status } from "./thresholds";

export interface SensorData {
    value: number;
    history: number[];
    status: Status;
}

export interface RackData {
    id: number;
    label: string;
    waterLevel: SensorData;
    ph: SensorData;
    ec: SensorData;
    waterTemp: SensorData;
    waterFlow: SensorData;
    lightIntensity: SensorData;
    overallStatus: Status;
    plantedAt?: string | null;
}

export interface RoomData {
    temperature: SensorData;
    humidity: SensorData;
}

export interface SystemStatus {
    esp32Online: boolean;
    serverOnline: boolean;
    lastUpdated: Date;
}

export interface DashboardData {
    room: RoomData;
    racks: RackData[];
    system: SystemStatus;
}


/**
 * Hook to fetch real room sensor data from the API.
 * Polls GET /api/room every 3 seconds.
 * Returns null if no data from ESP32 yet.
 */
export function useRoomSensor() {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [esp32Online, setEsp32Online] = useState(false);

    useEffect(() => {
        let active = true;

        async function fetchRoom() {
            try {
                const res = await fetch("/api/room", { cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json();

                if (!active) return;

                if (json.temperature && json.humidity) {
                    setRoomData({
                        temperature: json.temperature,
                        humidity: json.humidity,
                    });
                    setEsp32Online(json.esp32Online);
                } else {
                    setEsp32Online(false);
                }
            } catch {
                if (active) setEsp32Online(false);
            }
        }

        fetchRoom();
        const interval = setInterval(fetchRoom, 3000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    return { roomData, esp32Online };
}


