import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { idr } from "../../utils/format";

export function VerdictBanner({ result, onOpenAdvisor }) {
  const verdict = !result.eligible 
    ? "Tidak lolos batas LTV" 
    : result.npv > 0 
      ? "Refinancing layak" 
      : "Pertahankan KPR lama";
      
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-5 text-white shadow-md transition-all duration-500 ease-in-out ${result.eligible && result.npv > 0 ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-slate-700 to-slate-800"}`}>
        <div className="text-sm opacity-80 flex items-center gap-2">
          {result.eligible && result.npv > 0 ? <CheckCircle size={16} /> : <XCircle size={16} />}
          Rekomendasi
        </div>
        <div className="text-2xl font-bold mt-1">{verdict}</div>
        
        <div className="mt-3 pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm opacity-90">
            NPV penghematan {idr.format(result.npv)} · Break-even {result.breakEven ? `${result.breakEven} bulan` : "tidak tercapai"}
          </div>
          {onOpenAdvisor && (
            <button
              onClick={onOpenAdvisor}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all shadow-xs cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-200" />
              <span>Tanya AI Tenor Optimal</span>
            </button>
          )}
        </div>
      </div>
      
      {!result.eligible && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700/50 p-4 text-sm text-amber-800 dark:text-amber-200 shadow-sm animate-pulse">
          <AlertTriangle size={20} className="shrink-0" />
          <div>Pembiayaan baru {idr.format(result.newPrincipal)} melebihi batas LTV {idr.format(result.maxLoan)}. Silakan turunkan plafon atau naikkan LTV/Nilai Properti.</div>
        </div>
      )}
    </div>
  );
}
