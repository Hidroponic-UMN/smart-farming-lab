"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string;
  headerTitle?: string;
}

export function CodeBlock({ code, language = "JSON", headerTitle = "rack/+/data", className, ...props }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-glass-border shadow-lg">
      <div className="bg-primary-container px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-critical-rose/50"></div>
            <div className="w-3 h-3 rounded-full bg-warning-amber/50"></div>
            <div className="w-3 h-3 rounded-full bg-leaf-gradient-end/50"></div>
          </div>
          <span className="text-on-primary-container font-data-mono text-sm">{headerTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-on-tertiary-container font-label-caps text-xs">{language} FORMAT</span>
          <button
            onClick={copyToClipboard}
            className="text-on-tertiary-container hover:text-white transition-colors flex items-center"
            title="Copy to clipboard"
          >
            {hasCopied ? <Check className="h-4 w-4 text-leaf-gradient-end" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="bg-[#1e2a24] p-8 font-data-mono text-data-mono leading-relaxed overflow-x-auto">
        <pre className={cn("text-[#afcdbc]", className)} {...props}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
