"use client";

import { useSimulationContext, type SimulationMode } from "@/lib/simulation-context";
import Link from "next/link";
import { Activity, Power, Waves, ActivitySquare, Settings2, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Edit3, ArrowLeft, Check, Server } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SimulationPage() {
    const { 
        isMasterSimulating, setIsMasterSimulating,
        rackConfigs, updateRackConfig,
        setManualValue, toggleRackSensor
    } = useSimulationContext();

    const sensors = [
        { id: "ph", label: "pH Level" },
        { id: "ec", label: "Electrical Conductivity (EC)" },
        { id: "waterTemp", label: "Water Temperature" },
        { id: "waterLevel", label: "Water Level" },
        { id: "waterFlow", label: "Water Flow" },
        { id: "lightIntensity", label: "Light Intensity" }
    ];

    const racks = [1, 2, 3];

    const modes = [
        { id: "stable", label: "Stable Data", icon: Activity, desc: "Normal values with slight natural noise", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
        { id: "trending_up", label: "Data Up", icon: ArrowUpRight, desc: "Gradually increases", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
        { id: "trending_down", label: "Data Down", icon: ArrowDownRight, desc: "Gradually decreases", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
        { id: "manual", label: "Manual Value", icon: Edit3, desc: "Set fixed specific values", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" }
    ];

    return (
        <main className="min-h-screen bg-[#fafcfa] pb-24 md:pb-12 text-[#34473d]">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-10 px-4 md:px-8 max-w-7xl mx-auto">
              <div className="space-y-4">
                <Link href="/">
                  <button className="flex items-center gap-2 text-sm font-semibold text-[#34473d] hover:bg-white/50 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-xl transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </button>
                </Link>
                
                <div className="pt-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#34473d] tracking-tight">Advanced Simulation</h1>
                  <p className="text-lg text-[#34473d]/70 font-medium mt-2">
                    Inject mock data directly to the hardware datalogs per rack.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                
                {/* Hero / Master Switch */}
                <div className={`relative overflow-hidden rounded-3xl p-8 mb-8 transition-all duration-500 border ${isMasterSimulating ? 'bg-gradient-to-br from-[#34473d] to-[#1e2a24] border-[#34473d] text-white shadow-xl shadow-emerald-900/20' : 'bg-white border-gray-200 text-[#34473d] shadow-sm'}`}>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2.5 rounded-xl ${isMasterSimulating ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    <Power className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Master Toggle</h1>
                            </div>
                            <p className={`text-sm max-w-md ${isMasterSimulating ? 'text-white/80' : 'text-gray-500'}`}>
                                Enables the global simulation loop. When active, it will process all enabled racks below.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <span className="font-semibold">{isMasterSimulating ? "SIMULATION ACTIVE" : "SIMULATION OFF"}</span>
                            <Switch 
                                checked={isMasterSimulating} 
                                onCheckedChange={setIsMasterSimulating} 
                                className="data-[state=checked]:bg-emerald-500 scale-125 origin-right"
                            />
                        </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <ActivitySquare className={`absolute -right-8 -bottom-12 w-64 h-64 opacity-5 pointer-events-none transition-transform duration-1000 ${isMasterSimulating ? 'scale-110' : 'scale-90'}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {racks.map(rackId => {
                        const config = rackConfigs[rackId];
                        const isEnabled = config?.enabled ?? false;

                        return (
                            <div key={rackId} className={`flex flex-col bg-white rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden ${isEnabled ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-gray-200'}`}>
                                {/* Rack Header */}
                                <div className={`p-6 border-b transition-colors ${isEnabled ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl flex items-center justify-center font-bold shadow-sm ${isEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                                <Server className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Rack {rackId}</h2>
                                                <p className="text-xs text-gray-500 font-medium">Individual configuration</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={isEnabled}
                                            onCheckedChange={(val) => updateRackConfig(rackId, { enabled: val })}
                                        />
                                    </div>
                                </div>

                                {/* Rack Config Body */}
                                <div className={`p-6 flex-1 transition-all duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale-[0.5]'}`}>
                                    
                                    {/* Behavior Mode */}
                                    <div className="mb-8">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Behavior Mode</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {modes.map(m => {
                                                const isSelected = config?.mode === m.id;
                                                const Icon = m.icon;
                                                return (
                                                    <button 
                                                        key={m.id}
                                                        onClick={() => updateRackConfig(rackId, { mode: m.id as SimulationMode })}
                                                        className={`flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl transition-all border ${isSelected ? m.bg : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${isSelected ? m.color : 'text-gray-400'}`} />
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{m.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Target Sensors */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Target Sensors</label>
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Unselected = 0</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2">
                                            {sensors.map(s => {
                                                const isSelected = config?.sensors.includes(s.id) ?? false;
                                                const isManual = config?.mode === "manual";

                                                return (
                                                    <div 
                                                        key={s.id}
                                                        className={`flex flex-col gap-2 p-3 rounded-xl transition-all border ${isSelected ? 'bg-[#fafcfa] border-[#34473d]/20' : 'bg-white border-gray-100'}`}
                                                    >
                                                        <div 
                                                            className="flex items-center justify-between cursor-pointer"
                                                            onClick={() => toggleRackSensor(rackId, s.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex items-center justify-center w-5 h-5 rounded-md border ${isSelected ? 'bg-[#34473d] border-[#34473d]' : 'bg-gray-100 border-gray-200'}`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <span className={`text-sm font-semibold ${isSelected ? 'text-[#34473d]' : 'text-gray-400'}`}>{s.label}</span>
                                                            </div>
                                                        </div>

                                                        {/* Inline Manual Input */}
                                                        {isSelected && isManual && (
                                                            <div className="flex items-center gap-2 pl-8 pt-1 animate-in slide-in-from-top-1 duration-200">
                                                                <div className="p-1.5 bg-purple-100 rounded-md text-purple-600">
                                                                    <Edit3 className="w-3 h-3" />
                                                                </div>
                                                                <input 
                                                                    type="number"
                                                                    value={config?.manualValues[s.id] ?? 0}
                                                                    onChange={(e) => setManualValue(rackId, s.id, Number(e.target.value))}
                                                                    className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm font-mono rounded-md focus:ring-purple-500 focus:border-purple-500 block px-3 py-1.5"
                                                                    step="0.1"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
