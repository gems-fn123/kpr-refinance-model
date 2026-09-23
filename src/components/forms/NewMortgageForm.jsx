import React, { useState } from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { SchemeSelect } from "../ui/SchemeSelect";
import { SchemeFields } from "./SchemeFields";
import { bankPresets } from "../../constants/bankPresets";

export function NewMortgageForm({ state }) {
  const { 
    newYears, setNewYears, 
    newScheme, setNewScheme, 
    newCfg, setNewCfg, 
    penalty, setPenalty, 
    ltv, setLtv,
    setProvisionPct,
    setAdminFee
  } = state;

  const [selectedPresetId, setSelectedPresetId] = useState("");

  const handlePresetChange = (e) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    const preset = bankPresets.find(p => p.id === id);
    if (!preset) return;

    setNewScheme(preset.scheme);
    setNewCfg(preset.cfg);
    if (preset.defaultTenor) {
      setNewYears(preset.defaultTenor);
    }
    if (setProvisionPct && typeof preset.provisionPct === 'number') {
      setProvisionPct(preset.provisionPct);
    }
    if (setAdminFee && typeof preset.adminFee === 'number') {
      setAdminFee(preset.adminFee);
    }
  };

  const activePreset = bankPresets.find(p => p.id === selectedPresetId);

  return (
    <Card title="KPR Bank Baru">
      {/* Preset Bank & Promo Selector */}
      <div className="mb-3">
        <label className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          Preset Bank & Promo (Opsional)
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
          value={selectedPresetId}
          onChange={handlePresetChange}
        >
          <option value="">-- Pilih Preset Bank (Mandiri, BTN, BRI, BCA, CIMB, dll.) --</option>
          {bankPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              [{preset.badge}] {preset.name}
            </option>
          ))}
        </select>

        {activePreset && (
          <div className="mt-2 text-xs rounded-xl p-3 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-1.5 transition-all">
            <div className="flex items-center justify-between font-semibold">
              <span>{activePreset.bank} ({activePreset.badge})</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200">
                Tenor: {activePreset.minTenor} – {activePreset.maxTenor} Thn
              </span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {activePreset.description}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tenor baru" value={newYears} setValue={setNewYears} suffix="tahun" error={newYears <= 0 ? "Wajib > 0" : ""} />
        <SchemeSelect value={newScheme} setValue={setNewScheme} />
      </div>
      <div className="mt-3">
        <SchemeFields scheme={newScheme} cfg={newCfg} setCfg={setNewCfg} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Penalty Pelunasan Bank Lama</span>
          <select 
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" 
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
        <Field label="Maksimum LTV" value={ltv} setValue={v => setLtv(Math.min(100, Math.max(0, v)))} suffix="%" />
      </div>
    </Card>
  );
}
