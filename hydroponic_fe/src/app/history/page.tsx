"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Activity,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useRacks } from "@/lib/use-racks";

export default function HistoryHubPage() {
  const { racks, system } = useRacks();
  const displayRacks = racks || [];

  function formatDate(date: Date | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="size-4" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sensor History</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Arsip data dan grafik sensor setiap rack
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-blue-500/10 text-blue-600 border-none px-3 py-1 rounded-full"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Data Log
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Rack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map((rackId) => {
            const rack = displayRacks.find(r => r.id === rackId);

            return (
              <Card
                key={rackId}
                className="relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border-2 border-border/50 hover:border-blue-500/40"
              >

                <CardContent className="p-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                        {rackId}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          Rack {rackId}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {rack ? "System Logging Active" : "Waiting for data..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info list */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-foreground">
                          Data Points
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {rack ? "25 samples" : "0 samples"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-foreground">
                          Last Record
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatDate(system.lastUpdated)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/rack/${rackId}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full group transition-all hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-500"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Lihat Grafik Detail
                      <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
