import React from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { SchemeSelect } from "../ui/SchemeSelect";
import { SchemeFields } from "./SchemeFields";
import { bankPresets } from "../../constants/bankPresets";
import { describeScheme } from "../../utils/mortgage";

export function NewMortgageForm({ state }) {
  const { 
    newYears, setNewYears, 
    newScheme, setNewScheme, 
    newCfg, setNewCfg, 
    penalty, setPenalty, 
    ltv, setLtv,
    newPresetId, applyNewPreset,
    installmentCap, setInstallmentCap
  } = state;

  const activePreset = bankPresets.find(p => p.id === newPresetId);
  const tenorHint = activePreset && newYears > 0 && (newYears < activePreset.minTenor || newYears > activePreset.maxTenor)
    ? `Preset: tenor ${activePreset.minTenor}–${activePreset.maxTenor} thn`
    : "";

  return (
    <Card title="KPR Bank Baru">
      {/* Preset Bank & Promo Selector */}
      <div className="mb-3">
        <label className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          Preset Bank & Promo (Opsional)
        </label>
        <select
          className="w-full min-w-0 truncate rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 transition-colors"
          value={newPresetId}
          onChange={e => applyNewPreset(e.target.value)}
        >
          <option value="">-- Pilih preset bank (Mandiri, BTN, BRI, BCA, dll.) --</option>
          {bankPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              [{preset.badge}] {preset.name}
            </option>
          ))}
        </select>

        {activePreset && (
          <div className="mt-2 text-xs rounded-xl p-3 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-1.5 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-1.5 font-semibold">
              <span>{activePreset.bank} ({activePreset.badge})</span>
              <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200">
                Tenor: {activePreset.minTenor} – {activePreset.maxTenor} Thn
              </span>
            </div>
            <div className="text-[11px] font-medium leading-relaxed text-indigo-900 dark:text-indigo-200">
              {describeScheme(activePreset.scheme, activePreset.cfg)}
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {activePreset.description}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        <Field label="Tenor baru" value={newYears} setValue={setNewYears} suffix="tahun" error={newYears <= 0 ? "Wajib > 0" : ""} hint={tenorHint} />
        <Field label="Maksimum LTV" value={ltv} setValue={v => setLtv(Math.min(100, Math.max(0, v)))} suffix="%" />
      </div>
      <div className="mt-3">
        <SchemeSelect value={newScheme} setValue={setNewScheme} />
      </div>
      <div className="mt-3">
        <SchemeFields scheme={newScheme} cfg={newCfg} setCfg={setNewCfg} tenorYears={newYears} />
      </div>
      <div className="mt-3">
        <label className="block min-w-0">
          <span className="mb-1 block truncate text-xs font-medium text-slate-600 dark:text-slate-300">Penalti pelunasan bank lama</span>
          <select 
            className="w-full min-w-0 truncate rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 transition-colors" 
            value={penalty} 
            onChange={e => setPenalty(Number(e.target.value))}
          >
            <option value={0}>0% (Bebas Penalti / Syariah / Floating BCA)</option>
            <option value={1}>1% (Standar Floating)</option>
            <option value={2}>2% (BCA Fix / Standar Take-Over)</option>
            <option value={3}>3% (Standar Masa Fixed)</option>
            <option value={5}>5% (Promo Khusus Lock-In)</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
          </select>
        </label>
      </div>
      <div className="mt-3">
        <Field
          label="Batas cicilan maks/bln (untuk AI, opsional)"
          value={installmentCap}
          setValue={setInstallmentCap}
          suffix="Rp"
          note="0 = pakai cicilan tertinggi KPR lama. Dipakai AI saat mencari tenor optimal."
        />
      </div>
    </Card>
  );
}
