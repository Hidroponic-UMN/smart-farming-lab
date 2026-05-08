"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { DashboardData, RackData, RoomData, SensorData } from "./sensor-data";
import { getStatus, type Status } from "./thresholds";

export type SimulationMode = "stable" | "trending_up" | "trending_down";

interface SimulationContextValue {
    isSimulating: boolean;
    simulationMode: SimulationMode;
    simulatedData: DashboardData | null;
    toggleSimulation: (active: boolean) => void;
    setSimulationMode: (mode: SimulationMode) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

const HISTORY_LENGTH = 25;

function clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

function drift(current: number, min: number, max: number, volatility: number = 0.3, mode: SimulationMode = "stable"): number {
    const range = max - min;
    const noise = (Math.random() - 0.5) * 2 * volatility * range * 0.02;

    let target: number;
    let pullStrength: number;

    switch (mode) {
        case "trending_up":
            target = min + range * 0.85;
            pullStrength = 0.03;
            break;
        case "trending_down":
            target = min + range * 0.15;
            pullStrength = 0.03;
            break;
        default:
            target = (min + max) / 2;
            pullStrength = 0.01;
            break;
    }

    const pull = (target - current) * pullStrength;
    return clamp(current + noise + pull, min, max);
}

function createSensor(initial: number, type: string): SensorData {
    const history = Array.from({ length: HISTORY_LENGTH }, (_, i) => {
        const t = i / HISTORY_LENGTH;
        return initial + (Math.random() - 0.5) * 2 * t;
    });
    history[history.length - 1] = initial;
    return {
        value: initial,
        history,
        status: getStatus(initial, type),
    };
}

function updateSensor(
    sensor: SensorData,
    type: string,
    min: number,
    max: number,
    volatility: number = 0.3,
    mode: SimulationMode = "stable"
): SensorData {
    const newValue = drift(sensor.value, min, max, volatility, mode);
    const newHistory = [...sensor.history.slice(1), newValue];
    return {
        value: newValue,
        history: newHistory,
        status: getStatus(newValue, type),
    };
}

function getOverallStatus(sensors: Record<string, SensorData>): Status {
    const statuses = Object.values(sensors).map((s) => s.status);
    if (statuses.includes("Critical")) return "Critical";
    if (statuses.some((s) => s === "Low" || s === "High" || s === "Warning")) return "Warning";
    return "Normal";
}

function createRack(id: number): RackData {
    const wl = 40 + Math.random() * 50;
    const ph = 5.5 + Math.random() * 1.0;
    const ec = 1.2 + Math.random() * 1.0;
    const wt = 20 + Math.random() * 6;
    const flow = 2.0 + Math.random() * 3.0;
    const light = 15000 + Math.random() * 15000;

    const sensors = {
        waterLevel: createSensor(wl, "waterLevel"),
        ph: createSensor(ph, "ph"),
        ec: createSensor(ec, "ec"),
        waterTemp: createSensor(wt, "waterTemp"),
        waterFlow: createSensor(flow, "waterFlow"),
        lightIntensity: createSensor(light, "lightIntensity"),
    };

    return {
        id,
        label: `Rack ${id}`,
        ...sensors,
        overallStatus: getOverallStatus(sensors),
    };
}

function updateRack(rack: RackData, mode: SimulationMode): RackData {
    const sensors = {
        waterLevel: updateSensor(rack.waterLevel, "waterLevel", 5, 100, 0.15, mode),
        ph: updateSensor(rack.ph, "ph", 4.0, 8.0, 0.1, mode),
        ec: updateSensor(rack.ec, "ec", 0.5, 3.2, 0.15, mode),
        waterTemp: updateSensor(rack.waterTemp, "waterTemp", 16, 32, 0.2, mode),
        waterFlow: updateSensor(rack.waterFlow, "waterFlow", 0.0, 8.0, 0.2, mode),
        lightIntensity: updateSensor(rack.lightIntensity, "lightIntensity", 3000, 45000, 0.15, mode),
    };

    return {
        ...rack,
        ...sensors,
        overallStatus: getOverallStatus(sensors),
    };
}

function createInitialData(): DashboardData {
    return {
        room: {
            temperature: createSensor(26.5, "roomTemp"),
            humidity: createSensor(62, "roomHumidity"),
        },
        racks: [1, 2, 3, 4, 5].map(createRack),
        system: {
            esp32Online: true,
            serverOnline: true,
            lastUpdated: new Date(),
        },
    };
}

export function SimulationProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationMode, setSimulationMode] = useState<SimulationMode>("stable");
    const initialized = useRef(false);
    const modeRef = useRef<SimulationMode>(simulationMode);

    useEffect(() => {
        modeRef.current = simulationMode;
    }, [simulationMode]);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            setData(createInitialData());
        }
    }, []);

    const tick = useCallback(() => {
        const mode = modeRef.current;
        setData((prev) => {
            if (!prev) return prev;
            return {
                room: {
                    temperature: updateSensor(prev.room.temperature, "roomTemp", 22, 34, 0.2, mode),
                    humidity: updateSensor(prev.room.humidity, "roomHumidity", 40, 80, 0.2, mode),
                },
                racks: prev.racks.map((r) => updateRack(r, mode)),
                system: {
                    ...prev.system,
                    lastUpdated: new Date(),
                },
            };
        });
    }, []);

    useEffect(() => {
        if (!isSimulating) return;
        const interval = setInterval(tick, 2500);
        return () => clearInterval(interval);
    }, [isSimulating, tick]);

    const value: SimulationContextValue = {
        isSimulating,
        simulationMode,
        simulatedData: data,
        toggleSimulation: setIsSimulating,
        setSimulationMode,
    };

    return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulationContext() {
    const ctx = useContext(SimulationContext);
    if (!ctx) {
        throw new Error("useSimulationContext must be used within a SimulationProvider");
    }
    return ctx;
}
