import React from 'react';
import { Field } from "../ui/Field";

export function SchemeFields({ scheme, cfg, setCfg }) {
  const change = (key, value) => setCfg(x => ({ ...x, [key]: value }));
  
  if (scheme === "step") {
    return (
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
        <Field label="Tahap 1" value={cfg.step1Years} setValue={v => change("step1Years", v)} suffix="tahun" />
        <Field label="Bunga 1" value={cfg.step1Rate} setValue={v => change("step1Rate", v)} suffix="%" />
        <Field label="Tahap 2" value={cfg.step2Years} setValue={v => change("step2Years", v)} suffix="tahun" />
        <Field label="Bunga 2" value={cfg.step2Rate} setValue={v => change("step2Rate", v)} suffix="%" />
        <Field label="Bunga sisa tenor" value={cfg.step3Rate} setValue={v => change("step3Rate", v)} suffix="%" />
      </div>
    );
  }
  
  if (scheme === "fixedFloating") {
    return (
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
        <Field label="Masa fixed" value={cfg.fixedYears} setValue={v => change("fixedYears", v)} suffix="tahun" />
        <Field label="Bunga fixed" value={cfg.fixedRate} setValue={v => change("fixedRate", v)} suffix="%" />
        <Field label="Asumsi floating" value={cfg.floatingRate} setValue={v => change("floatingRate", v)} suffix="%" />
      </div>
    );
  }
  
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
      <Field label="Bunga fixed sampai lunas" value={cfg.fullFixedRate} setValue={v => change("fullFixedRate", v)} suffix="%" />
    </div>
  );
}
