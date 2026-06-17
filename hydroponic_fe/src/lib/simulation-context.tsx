"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { RackData } from "./sensor-data";

export type SimulationMode = "stable" | "trending_up" | "trending_down" | "manual";

export interface RackSimulationConfig {
    enabled: boolean;
    mode: SimulationMode;
    sensors: string[];
    manualValues: Record<string, number>;
}

interface SimulationContextValue {
    isMasterSimulating: boolean;
    rackConfigs: Record<number, RackSimulationConfig>;

    setIsMasterSimulating: (active: boolean) => void;
    updateRackConfig: (rackId: number, config: Partial<RackSimulationConfig>) => void;
    setManualValue: (rackId: number, sensor: string, value: number) => void;
    toggleRackSensor: (rackId: number, sensor: string) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

function clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

export function getSensorRange(sensorKey: string) {
    switch (sensorKey) {
        case "waterLevel": return { min: 60, max: 70, vol: 0.15 };
        case "ph": return { min: 5.5, max: 6.5, vol: 0.1 };
        case "ec": return { min: 1.2, max: 2.2, vol: 0.15 };
        case "waterTemp": return { min: 20, max: 22, vol: 0.2 };
        case "waterFlow": return { min: 2.0, max: 3.5, vol: 0.2 };
        case "lightIntensity": return { min: 5700, max: 5900, vol: 0.15 };
        default: return { min: 0, max: 100, vol: 0.1 };
    }
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

const DEFAULT_SENSORS = ["ph", "ec", "waterTemp", "waterLevel", "waterFlow", "lightIntensity"];
const DEFAULT_MANUAL_VALUES = {
    ph: 6.0,
    ec: 1.5,
    waterTemp: 21.0,
    waterLevel: 65.0,
    waterFlow: 2.5,
    lightIntensity: 5800.0
};

export function SimulationProvider({ children }: { children: React.ReactNode }) {
    const [isMasterSimulating, setIsMasterSimulating] = useState(false);
    const [rackConfigs, setRackConfigs] = useState<Record<number, RackSimulationConfig>>({
        1: { enabled: false, mode: "stable", sensors: [...DEFAULT_SENSORS], manualValues: { ...DEFAULT_MANUAL_VALUES } },
        2: { enabled: false, mode: "stable", sensors: [...DEFAULT_SENSORS], manualValues: { ...DEFAULT_MANUAL_VALUES } },
        3: { enabled: false, mode: "stable", sensors: [...DEFAULT_SENSORS], manualValues: { ...DEFAULT_MANUAL_VALUES } },
    });

    const stateRef = useRef({ isMasterSimulating, rackConfigs });
    
    useEffect(() => {
        stateRef.current = { isMasterSimulating, rackConfigs };
    }, [isMasterSimulating, rackConfigs]);

    const updateRackConfig = (rackId: number, partialConfig: Partial<RackSimulationConfig>) => {
        setRackConfigs(prev => ({
            ...prev,
            [rackId]: { ...prev[rackId], ...partialConfig }
        }));
    };

    const setManualValue = (rackId: number, sensor: string, value: number) => {
        setRackConfigs(prev => ({
            ...prev,
            [rackId]: {
                ...prev[rackId],
                manualValues: { ...prev[rackId].manualValues, [sensor]: value }
            }
        }));
    };

    const toggleRackSensor = (rackId: number, sensor: string) => {
        setRackConfigs(prev => {
            const config = prev[rackId];
            const isSelected = config.sensors.includes(sensor);
            return {
                ...prev,
                [rackId]: {
                    ...config,
                    sensors: isSelected 
                        ? config.sensors.filter(s => s !== sensor)
                        : [...config.sensors, sensor]
                }
            };
        });
    };

    useEffect(() => {
        if (!isMasterSimulating) return;

        const tick = async () => {
            const { rackConfigs } = stateRef.current;
            
            try {
                // Fetch base data
                const res = await fetch("/api/racks", { cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json();
                const racks: RackData[] = json.racks || [];

                const backendKeys: Record<string, string> = {
                    ph: "ph",
                    ec: "ec",
                    waterTemp: "water_temp",
                    waterLevel: "water_level",
                    waterFlow: "water_flow",
                    lightIntensity: "light_intensity"
                };

                for (const rack of racks) {
                    const config = rackConfigs[rack.id];
                    // Only process racks 1-3 that are explicitly enabled in their own config
                    if (!config || !config.enabled) continue;

                    const payloadData: Record<string, number> = {};
                    
                    for (const key of DEFAULT_SENSORS) {
                        const bKey = backendKeys[key];
                        if (!bKey) continue;

                        if (config.sensors.includes(key)) {
                            // Sensor is selected for simulation
                            if (config.mode === "manual") {
                                const { vol } = getSensorRange(key);
                                const noise = (Math.random() - 0.5) * vol * 0.5;
                                const baseVal = config.manualValues[key] || 0;
                                payloadData[bKey] = Math.max(0, baseVal + noise);
                            } else {
                                const currentVal = (rack as any)[key]?.value ?? 0;
                                const { min, max, vol } = getSensorRange(key);
                                payloadData[bKey] = drift(currentVal, min, max, vol, config.mode);
                            }
                        } else {
                            // Sensor is NOT selected, force reading to 0
                            payloadData[bKey] = 0;
                        }
                    }

                    if (Object.keys(payloadData).length > 0) {
                        await fetch("/api/simulation", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                rack_id: rack.id,
                                data: payloadData
                            })
                        });
                    }
                }
            } catch (err) {
                console.error("Simulation tick failed:", err);
            }
        };

        // Fire immediately to reflect changes instantly, then loop every 10s
        tick();
        const interval = setInterval(tick, 10000);
        return () => clearInterval(interval);
    }, [isMasterSimulating]);

    const value: SimulationContextValue = {
        isMasterSimulating,
        rackConfigs,
        setIsMasterSimulating,
        updateRackConfig,
        setManualValue,
        toggleRackSensor
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
