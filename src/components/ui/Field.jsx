import React from 'react';
import { num } from "../../utils/format";

export function Field({ label, value, setValue, suffix = "", error = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <div className="relative">
        <input 
          className={`w-full rounded-xl border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-slate-600 dark:focus:border-indigo-400'} bg-white dark:bg-slate-800 px-3 py-2 pr-16 outline-none transition-colors dark:text-white`}
          type="number" 
          value={value} 
          onChange={e => setValue(num(e.target.value))}
        />
        <span className="absolute right-3 top-2.5 text-xs text-slate-400 dark:text-slate-500">
          {suffix}
        </span>
      </div>
      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </label>
  );
}
