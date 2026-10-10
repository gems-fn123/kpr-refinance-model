import React from 'react';
import { Card } from "../ui/Card";
import { idr } from "../../utils/format";

function Side({ title, data, accent }) {
  return (
    <div className="min-w-0">
      <div className={`truncate text-[11px] font-medium ${accent ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
        {title}
      </div>
      {data ? (
        <>
          <div className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white">{idr.format(data.payment)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{data.stage} · {data.rate.toFixed(2)}%</div>
        </>
      ) : (
        <div className="mt-0.5 text-sm font-semibold text-slate-400">Lunas</div>
      )}
    </div>
  );
}

export function StageBreakdown({ result }) {
  const periods = result.periods || [];
  if (periods.length === 0) return null;

  const totalDiff = periods.reduce((sum, p) => sum + p.periodSaving, 0);

  return (
    <Card title="Cicilan per Tahap Bunga">
      <p className="mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Setiap pergantian tahap bunga, cicilan dihitung ulang dari sisa pokok dan sisa tenor (anuitas).
      </p>
      <div className="grid gap-3 xl:grid-cols-2">
        {periods.map(p => {
          const months = p.endMonth - p.startMonth + 1;
          return (
            <div key={p.startMonth} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{p.label}</span>
                <span className="text-slate-500 dark:text-slate-400">Bulan {p.startMonth}–{p.endMonth} · {months} bln</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Side title="Bank lama" data={p.old} />
                <Side title="Bank baru" data={p.newer} accent />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-slate-100 dark:border-slate-700 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <span>
                  Selisih/bln{" "}
                  <b className={p.monthlySaving >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {idr.format(p.monthlySaving)}
                  </b>
                </span>
                <span>
                  Periode{" "}
                  <b className={p.periodSaving >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {idr.format(p.periodSaving)}
                  </b>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 px-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <span>Total selisih cicilan (sebelum penalti)</span>
        <b className={totalDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{idr.format(totalDiff)}</b>
      </div>
    </Card>
  );
}
