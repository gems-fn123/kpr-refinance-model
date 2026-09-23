import React from 'react';
import { Info } from "lucide-react";

export function Tooltip({ text }) {
  return (
    <div className="group relative inline-flex items-center justify-center ml-1">
      <Info size={14} className="text-slate-400 hover:text-indigo-500 cursor-help" />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 -translate-x-1/2 mb-2 w-48 rounded bg-slate-800 p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-700">
        {text}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
      </div>
    </div>
  );
}
