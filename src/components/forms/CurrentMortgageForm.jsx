import React from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { SchemeSelect } from "../ui/SchemeSelect";
import { SchemeFields } from "./SchemeFields";
import { bankPresets } from "../../constants/bankPresets";
import { describeScheme } from "../../utils/mortgage";
import { idr } from "../../utils/format";

// Lets the AI advisor skip same-bank presets (refinancing within one bank is not a take-over).
const BANKS = [...new Set(bankPresets.map(p => p.bank))];

const MODES = [
  { id: "manual", label: "Isi sisa pokok" },
  { id: "origination", label: "Hitung dari awal KPR" }
];

function Row({ label, children, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-right ${strong ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-800 dark:text-slate-200'}`}>{children}</span>
    </div>
  );
}

function OriginationFields({ state, result }) {
  const {
    propertyValue, setPropertyValue,
    origPrice, setOrigPrice,
    dpAmount, setDpAmount,
    origTenor, setOrigTenor,
    elapsedYears, setElapsedYears,
    origScheme, setOrigScheme,
    origCfg, setOrigCfg,
    bankBalance, setBankBalance,
    useBankBalance, setUseBankBalance,
    origPresetId, applyOrigPreset
  } = state;
  const o = result.origination;
  const preset = bankPresets.find(p => p.id === origPresetId);

  const dpPct = origPrice > 0 ? Math.round(dpAmount / origPrice * 10000) / 100 : 0;
  const elapsedError = origTenor > 0 && o.remainingMonths === 0 ? "Sudah lunas / ≥ tenor" : "";
  const dpError = dpAmount >= origPrice && origPrice > 0 ? "DP ≥ harga beli" : "";

  const current = o.currentRow;
  const diff = bankBalance > 0 ? bankBalance - o.computedBalance : 0;
  const diffPct = o.computedBalance > 0 ? diff / o.computedBalance * 100 : 0;
  const matches = Math.abs(diffPct) <= 1;

  return (
    <div className="space-y-3">
      <div>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Skema KPR saat ini (preset bank, opsional)</span>
          <select
            className="w-full min-w-0 truncate rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 transition-colors"
            value={origPresetId}
            onChange={e => applyOrigPreset(e.target.value)}
          >
            <option value="">-- Isi skema manual / pilih preset --</option>
            {bankPresets.map(p => (
              <option key={p.id} value={p.id}>[{p.badge}] {p.name}</option>
            ))}
          </select>
        </label>
        {preset && (
          <div className="mt-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 bg-indigo-50/80 dark:bg-indigo-950/40 p-2.5 text-[11px] leading-relaxed text-indigo-900 dark:text-indigo-200">
            {describeScheme(preset.scheme, preset.cfg)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        <Field label="Harga beli properti" value={origPrice} setValue={setOrigPrice} suffix="Rp" error={origPrice <= 0 ? "Wajib > 0" : ""} />
        <Field label="Nilai properti saat ini" value={propertyValue} setValue={setPropertyValue} suffix="Rp" error={propertyValue <= 0 ? "Wajib > 0" : ""} />
        <Field label="Uang muka (DP)" value={dpAmount} setValue={v => setDpAmount(Math.min(v, origPrice))} suffix="Rp" error={dpError} />
        <Field label="DP (%)" value={dpPct} setValue={v => setDpAmount(Math.round(origPrice * Math.min(v, 100) / 100))} suffix="%" />
        <Field label="Tenor awal" value={origTenor} setValue={setOrigTenor} suffix="tahun" error={origTenor <= 0 ? "Wajib > 0" : ""} />
        <Field
          label="Sudah berjalan"
          value={elapsedYears}
          setValue={setElapsedYears}
          suffix="tahun"
          error={elapsedError}
          note={`= ${o.elapsedMonths} bulan`}
        />
      </div>

      <SchemeSelect value={origScheme} setValue={setOrigScheme} />
      <SchemeFields scheme={origScheme} cfg={origCfg} setCfg={setOrigCfg} tenorYears={origTenor} fromStart />

      <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs">
        <div className="mb-1 font-semibold text-slate-900 dark:text-white">Posisi KPR saat ini (hasil hitungan)</div>
        <Row label="Plafon awal">{idr.format(o.principal)}</Row>
        <Row label="Cicilan bulan ke-1">{idr.format(o.firstPayment)}</Row>
        <Row label="Sudah dibayar">{o.elapsedMonths} bulan</Row>
        <Row label="Bunga sudah dibayar">{idr.format(o.paidInterest)}</Row>
        {current && (
          <Row label={`Tahap bulan ke-${current.month} (th ${Math.ceil(current.month / 12)})`}>
            {current.stage} · {current.rate.toFixed(2)}%
          </Row>
        )}
        {current && <Row label="Cicilan saat ini">{idr.format(current.payment)}</Row>}
        <Row label="Sisa tenor">{+(o.remainingMonths / 12).toFixed(2)} thn ({o.remainingMonths} bln)</Row>
        <Row label="Sisa pokok (hitungan)" strong>{idr.format(o.computedBalance)}</Row>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
        <div className="text-xs font-semibold text-slate-900 dark:text-white">Cek silang sisa pokok</div>
        <Field label="Sisa pokok menurut bank (opsional)" value={bankBalance} setValue={setBankBalance} suffix="Rp" />
        {bankBalance > 0 && (
          <>
            <div className={`rounded-lg px-2.5 py-2 text-xs ${matches ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'}`}>
              {matches
                ? `Sesuai: selisih ${idr.format(diff)} (${diffPct.toFixed(2)}%).`
                : `Selisih ${idr.format(diff)} (${diffPct.toFixed(2)}%) dari hitungan. Penyebab umum: bunga floating aktual berbeda dari asumsi, pernah pelunasan sebagian, atau tanggal cut-off berbeda.`}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300">Dipakai untuk perhitungan:</span>
              <div className="inline-flex rounded-lg bg-white dark:bg-slate-800 p-0.5 ring-1 ring-slate-200 dark:ring-slate-600">
                {[{ v: true, l: "Data bank" }, { v: false, l: "Hasil hitungan" }].map(opt => (
                  <button
                    key={opt.l}
                    type="button"
                    onClick={() => setUseBankBalance(opt.v)}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${useBankBalance === opt.v ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CurrentMortgageForm({ state, result }) {
  const {
    propertyValue, setPropertyValue,
    balance, setBalance,
    remainingYears, setRemainingYears,
    oldScheme, setOldScheme,
    oldCfg, setOldCfg,
    oldMonthlyFee, setOldMonthlyFee,
    oldInputMode, setOldInputMode,
    oldBank, setOldBank
  } = state;

  return (
    <Card title="KPR Bank Saat Ini">
      <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 p-1 text-xs font-medium">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOldInputMode(m.id)}
            className={`rounded-lg px-2 py-1.5 transition-colors ${oldInputMode === m.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label className="mb-3 block min-w-0">
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Bank KPR saat ini (opsional)</span>
        <select
          className="w-full min-w-0 truncate rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-base sm:text-sm outline-none focus:border-indigo-500 transition-colors"
          value={oldBank}
          onChange={e => setOldBank(e.target.value)}
        >
          <option value="">-- Tidak disebut / bank lain --</option>
          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>

      {oldInputMode === "origination" ? (
        <OriginationFields state={state} result={result} />
      ) : (
        <>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            <Field label="Nilai properti" value={propertyValue} setValue={setPropertyValue} suffix="Rp" error={propertyValue <= 0 ? "Wajib > 0" : ""} />
            <Field label="Sisa pokok" value={balance} setValue={setBalance} suffix="Rp" error={balance <= 0 ? "Wajib > 0" : ""} />
            <Field label="Sisa tenor" value={remainingYears} setValue={setRemainingYears} suffix="tahun" error={remainingYears <= 0 ? "Wajib > 0" : ""} />
            <Field label="Biaya bulanan lain" value={oldMonthlyFee} setValue={setOldMonthlyFee} suffix="Rp" />
          </div>
          <div className="mt-3">
            <SchemeSelect value={oldScheme} setValue={setOldScheme} />
          </div>
          <div className="mt-3">
            <SchemeFields scheme={oldScheme} cfg={oldCfg} setCfg={setOldCfg} tenorYears={remainingYears} isCurrentLoan />
          </div>
        </>
      )}

      {oldInputMode === "origination" && (
        <div className="mt-3">
          <Field label="Biaya bulanan lain" value={oldMonthlyFee} setValue={setOldMonthlyFee} suffix="Rp" />
        </div>
      )}
    </Card>
  );
}
