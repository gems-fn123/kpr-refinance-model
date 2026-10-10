import React from 'react';
import { Plus, Trash2 } from "lucide-react";
import { Field } from "../ui/Field";
import { stepTiers, floatingStartMonth, periodLabel } from "../../utils/mortgage";

const MAX_STEPS = 6;

const startLabel = (month) => (month - 1) % 12 === 0 ? `th ${(month - 1) / 12 + 1}` : `bln ${month}`;

export function SchemeFields({ scheme, cfg, setCfg, tenorYears, isCurrentLoan = false, fromStart = false }) {
  const change = (key, value) => setCfg(x => ({ ...x, [key]: value }));
  const tenorMonths = Math.round((tenorYears || 0) * 12);
  const floatStart = floatingStartMonth(scheme, cfg);
  const floatingUnused = tenorMonths > 0 && floatStart > tenorMonths;

  if (scheme === "step") {
    const steps = cfg.steps || [];
    const tiers = stepTiers(cfg);
    const tierByIndex = Object.fromEntries(tiers.map(t => [t.index, t]));

    const changeStep = (index, key, value) => setCfg(x => ({
      ...x,
      steps: (x.steps || []).map((s, i) => i === index ? { ...s, [key]: value } : s)
    }));
    const addStep = () => setCfg(x => {
      const current = x.steps || [];
      const last = current[current.length - 1];
      return { ...x, steps: [...current, { years: 2, rate: last ? last.rate : (x.floatingRate || 0) }] };
    });
    const removeStep = (index) => setCfg(x => ({
      ...x,
      steps: (x.steps || []).filter((_, i) => i !== index)
    }));

    return (
      <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
        {(isCurrentLoan || fromStart) && (
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {fromStart
              ? "Tahapan dihitung dari awal kredit (bulan ke-1)."
              : "Isi tahapan mulai dari bulan ini: tahap 1 = sisa durasi tahap yang sedang berjalan."}
          </p>
        )}

        {steps.map((s, i) => {
          const tier = tierByIndex[i];
          const range = tier ? periodLabel(tier.startMonth, tier.endMonth) : "0 bln";
          const beyondTenor = tier && tenorMonths > 0 && tier.startMonth > tenorMonths;
          return (
            <div key={i} className={`border-b border-slate-200/70 dark:border-slate-600/50 pb-3 ${beyondTenor ? 'opacity-60' : ''}`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Tahap {i + 1} fixed <span className="font-normal text-slate-500 dark:text-slate-400">· {range}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={steps.length <= 1}
                  title={`Hapus tahap ${i + 1}`}
                  aria-label={`Hapus tahap ${i + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durasi" value={s.years} setValue={v => changeStep(i, "years", v)} suffix="tahun" />
                <Field label="Bunga fixed" value={s.rate} setValue={v => changeStep(i, "rate", v)} suffix="%" />
              </div>
              {beyondTenor && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Tahap ini di luar tenor {tenorYears} thn, tidak terpakai.</p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addStep}
          disabled={steps.length >= MAX_STEPS}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} />
          Tambah tahap fixed
        </button>

        <Field
          label={`Bunga floating (mulai ${startLabel(floatStart)} s.d. lunas)`}
          value={cfg.floatingRate}
          setValue={v => change("floatingRate", v)}
          suffix="%"
          hint={floatingUnused ? `Tidak terpakai: total tahap fixed ≥ tenor ${tenorYears} thn` : ""}
        />
      </div>
    );
  }

  if (scheme === "fixedFloating") {
    return (
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
        {(isCurrentLoan || fromStart) && (
          <p className="col-span-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {fromStart ? "Masa fixed dihitung dari awal kredit." : "Masa fixed = sisa masa fixed dihitung dari bulan ini."}
          </p>
        )}
        <Field label="Masa fixed" value={cfg.fixedYears} setValue={v => change("fixedYears", v)} suffix="tahun" />
        <Field label="Bunga fixed" value={cfg.fixedRate} setValue={v => change("fixedRate", v)} suffix="%" />
        <Field
          label={`Floating (mulai ${startLabel(floatStart)})`}
          value={cfg.floatingRate}
          setValue={v => change("floatingRate", v)}
          suffix="%"
          hint={floatingUnused ? `Tidak terpakai: masa fixed ≥ tenor` : ""}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
      <Field label="Bunga fixed sampai lunas" value={cfg.fullFixedRate} setValue={v => change("fullFixedRate", v)} suffix="%" />
    </div>
  );
}
