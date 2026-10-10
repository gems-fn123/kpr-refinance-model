import React from 'react';
import { Info } from "lucide-react";

// Opens toward the left so it never sticks out past the right edge of a phone screen; tap (focus) shows it on touch devices.
export function Tooltip({ text }) {
  return (
    <div className="group relative inline-flex items-center justify-center ml-1" tabIndex={0} aria-label={text}>
      <Info size={14} className="text-slate-400 hover:text-indigo-500 cursor-help" />
      <div className="pointer-events-none absolute bottom-full -right-1 z-50 mb-2 w-48 max-w-[70vw] rounded bg-slate-800 p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-slate-700">
        {text}
        <div className="absolute right-1.5 top-full border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
      </div>
    </div>
  );
}
