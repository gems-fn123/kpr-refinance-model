import React from 'react';
import { num } from "../../utils/format";

export function Field({ label, value, setValue, suffix = "", error = "", hint = "", note = "" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-xs font-medium text-slate-600 dark:text-slate-300" title={label}>
        {label}
      </span>
      <div className="relative">
        <input
          className={`w-full min-w-0 rounded-xl border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-slate-600 dark:focus:border-indigo-400'} bg-white dark:bg-slate-800 py-2 pl-3 ${suffix.length > 2 ? 'pr-14' : 'pr-9'} outline-none transition-colors dark:text-white`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value ?? ""}
          onChange={e => setValue(num(e.target.value))}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
          {suffix}
        </span>
      </div>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      {!error && hint && <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">{hint}</span>}
      {!error && !hint && note && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{note}</span>}
    </label>
  );
}
