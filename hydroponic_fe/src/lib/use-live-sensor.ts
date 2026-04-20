"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isStable } from "./calibration";

interface LiveSensorData {
  rawPh: number;
  rawTds: number;
  waterTemp: number;
  timestamp: Date;
}

interface UseLiveSensorResult {
  /** Current raw pH ADC value */
  rawPh: number;
  /** Current raw TDS ADC value */
  rawTds: number;
  /** Current water temperature in °C */
  waterTemp: number;
  /** History of recent raw pH readings */
  phHistory: number[];
  /** History of recent raw TDS readings */
  tdsHistory: number[];
  /** Whether the pH reading is currently stable */
  phStable: boolean;
  /** Whether the TDS reading is currently stable */
  tdsStable: boolean;
  /** Whether sensor data is being received */
  isOnline: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if polling fails */
  error: string | null;
}

const HISTORY_SIZE = 30;
const POLL_INTERVAL = 2000; // 2 seconds

/**
 * Hook that polls raw sensor data for calibration purposes.
 * Reads from the existing /api/racks endpoint which returns raw ADC values.
 */
export function useLiveSensor(rackId: number): UseLiveSensorResult {
  const [data, setData] = useState<LiveSensorData>({
    rawPh: 0,
    rawTds: 0,
    waterTemp: 25,
    timestamp: new Date(),
  });
  const [phHistory, setPhHistory] = useState<number[]>([]);
  const [tdsHistory, setTdsHistory] = useState<number[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // We use the raw_mode=true parameter so the API route
      // returns raw ADC values (skipping calibration conversion)
      const res = await fetch(`/api/racks?raw_mode=true`);
      if (!res.ok) {
        setError("Failed to fetch sensor data");
        setIsOnline(false);
        return;
      }

      const json = await res.json();

      if (!activeRef.current) return;

      const rack = json.racks?.find(
        (r: { id: number }) => r.id === rackId
      );

      if (rack) {
        const rawPh = rack.ph?.value ?? 0;
        const rawTds = rack.ec?.value ?? 0;
        const waterTemp = rack.waterTemp?.value ?? 25;

        setData({
          rawPh,
          rawTds,
          waterTemp,
          timestamp: new Date(),
        });

        setPhHistory((prev) => [...prev.slice(-(HISTORY_SIZE - 1)), rawPh]);
        setTdsHistory((prev) => [...prev.slice(-(HISTORY_SIZE - 1)), rawTds]);
        setIsOnline(json.isOnline ?? false);
        setError(null);
      } else {
        setIsOnline(false);
        setError(`Rack ${rackId} not found`);
      }

      setLoading(false);
    } catch {
      if (activeRef.current) {
        setError("Connection error");
        setIsOnline(false);
        setLoading(false);
      }
    }
  }, [rackId]);

  useEffect(() => {
    activeRef.current = true;
    setLoading(true);
    setPhHistory([]);
    setTdsHistory([]);

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return {
    rawPh: data.rawPh,
    rawTds: data.rawTds,
    waterTemp: data.waterTemp,
    phHistory,
    tdsHistory,
    phStable: isStable(phHistory, 5, 15),
    tdsStable: isStable(tdsHistory, 5, 20),
    isOnline,
    loading,
    error,
  };
}
