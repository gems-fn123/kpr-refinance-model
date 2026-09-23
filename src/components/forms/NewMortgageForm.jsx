import React from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { SchemeSelect } from "../ui/SchemeSelect";
import { SchemeFields } from "./SchemeFields";

export function NewMortgageForm({ state }) {
  const { 
    newYears, setNewYears, 
    newScheme, setNewScheme, 
    newCfg, setNewCfg, 
    penalty, setPenalty, 
    ltv, setLtv 
  } = state;

  return (
    <Card title="KPR Bank Baru">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tenor baru" value={newYears} setValue={setNewYears} suffix="tahun" error={newYears <= 0 ? "Wajib > 0" : ""} />
        <SchemeSelect value={newScheme} setValue={setNewScheme} />
      </div>
      <div className="mt-3">
        <SchemeFields scheme={newScheme} cfg={newCfg} setCfg={setNewCfg} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Penalty Pelunasan</span>
          <select 
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors" 
            value={penalty} 
            onChange={e => setPenalty(Number(e.target.value))}
          >
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
          </select>
        </label>
        <Field label="Maksimum LTV" value={ltv} setValue={v => setLtv(Math.min(100, Math.max(0, v)))} suffix="%" />
      </div>
    </Card>
  );
}
