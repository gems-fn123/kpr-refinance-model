import React, { useEffect, useState } from 'react';
import { Tooltip } from './Tooltip';

export function Metric({ label, value, good, info }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(value);
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-colors ${highlight ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
        {label}
        {info && <Tooltip text={info} />}
      </div>
      <div className={`mt-1 text-lg font-bold transition-all ${good === true ? "text-emerald-600 dark:text-emerald-400" : good === false ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
        {displayValue}
      </div>
    </div>
  );
}
