import React from 'react';

export function SchemeSelect({ value, setValue }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        Skema bunga
      </span>
      <select 
        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors" 
        value={value} 
        onChange={e => setValue(e.target.value)}
      >
        <option value="step">Fixed bertahap</option>
        <option value="fixedFloating">Fixed lalu floating</option>
        <option value="full">Fixed sampai akhir</option>
      </select>
    </label>
  );
}
