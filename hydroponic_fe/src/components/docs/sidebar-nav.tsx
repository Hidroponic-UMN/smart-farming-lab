"use client";

import Link from "next/link";
import { Info, Star, Terminal, Network, Cpu, Radio, Server, Database, Monitor, Rocket, ExternalLink } from "lucide-react";

export function SidebarNav() {
  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-glass-surface backdrop-blur-xl border-r border-glass-border shadow-sm flex flex-col py-8 px-6 gap-stack-md overflow-y-auto z-50 hidden lg:flex">
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg text-doc-primary leading-tight">Smart Farming Lab</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-2">v2.4.0 Technical Docs</p>
      </div>
      
      <nav className="flex flex-col gap-1">
        <Link href="#project-overview" className="flex items-center gap-3 bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2 font-bold transition-all scale-95 duration-150 ease-in-out">
          <Info className="w-5 h-5" />
          <span>Introduction</span>
        </Link>
        <Link href="#features" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Star className="w-5 h-5" />
          <span>Features</span>
        </Link>
        <Link href="#tech-stack" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Terminal className="w-5 h-5" />
          <span>Tech Stack</span>
        </Link>
        <Link href="#architecture-preview" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Network className="w-5 h-5" />
          <span>Architecture</span>
        </Link>
        <Link href="#hardware-iot" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Cpu className="w-5 h-5" />
          <span>Hardware</span>
        </Link>
        <Link href="#mqtt-payload" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Radio className="w-5 h-5" />
          <span>MQTT</span>
        </Link>
        <Link href="#backend" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Server className="w-5 h-5" />
          <span>Backend</span>
        </Link>
        <Link href="#database" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Database className="w-5 h-5" />
          <span>Database</span>
        </Link>
        <Link href="#frontend" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Monitor className="w-5 h-5" />
          <span>Frontend</span>
        </Link>
        <Link href="#deployment" className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-low transition-colors rounded-lg">
          <Rocket className="w-5 h-5" />
          <span>Deployment</span>
        </Link>
      </nav>

      <div className="mt-auto pt-8">
        <button className="w-full bg-doc-primary text-on-doc-primary font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <span>API Reference</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
