import React from 'react';
import { Card } from "../ui/Card";
import { idr } from "../../utils/format";

export function SummaryTable({ result }) {
  return (
    <Card title="Ringkasan">
      <div className="grid gap-6 text-sm md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <b className="text-slate-900 dark:text-white mb-3 block">Bank Lama</b>
          <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-400">
            <span>Total pembayaran</span>
            <b className="text-slate-900 dark:text-white">{idr.format(result.old.totalPayment)}</b>
          </div>
          <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-400">
            <span>Total bunga</span>
            <span className="text-slate-900 dark:text-white">{idr.format(result.old.totalInterest)}</span>
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10 p-4">
          <b className="text-indigo-900 dark:text-indigo-300 mb-3 block">Bank Baru</b>
          <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-400">
            <span>Total pembayaran + penalty</span>
            <b className="text-indigo-700 dark:text-indigo-400">{idr.format(result.newer.totalPayment + result.penaltyCost)}</b>
          </div>
          <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-400">
            <span>Biaya proses dibiayai</span>
            <span className="text-slate-900 dark:text-white">{idr.format(result.processFees)}</span>
          </div>
          <div className="mt-2 flex justify-between text-slate-600 dark:text-slate-400">
            <span>Penalti pelunasan</span>
            <span className="text-slate-900 dark:text-white">{idr.format(result.penaltyCost)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
