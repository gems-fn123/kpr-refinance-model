import React, { useState } from 'react';
import { Card } from "../ui/Card";
import { idr } from "../../utils/format";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export function AmortizationTable({ result }) {
  const [tab, setTab] = useState('baru');
  const [page, setPage] = useState(0);
  const rowsPerPage = 12;

  const activeData = tab === 'baru' ? result.newer.rows : result.old.rows;
  const totalPages = Math.max(1, Math.ceil(activeData.length / rowsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const currentRows = activeData.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);

  const exportCsv = () => {
    const headers = ['Bulan', 'Bunga (%)', 'Cicilan', 'Pokok', 'Bunga', 'Sisa Saldo'];
    const csvContent = [
      headers.join(','),
      ...activeData.map(r => [
        r.month,
        r.rate.toFixed(2),
        Math.round(r.payment),
        Math.round(r.principalPaid),
        Math.round(r.interest),
        Math.round(r.balance)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tabel_amortisasi_${tab}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card title="Tabel Amortisasi">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'lama' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => { setTab('lama'); setPage(0); }}
          >
            Bank Lama
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'baru' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => { setTab('baru'); setPage(0); }}
          >
            Bank Baru
          </button>
        </div>
        
        <button onClick={exportCsv} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Bulan / Tahun</th>
              <th className="px-4 py-3 font-medium">Suku Bunga</th>
              <th className="px-4 py-3 font-medium text-right">Cicilan</th>
              <th className="px-4 py-3 font-medium text-right">Porsi Pokok</th>
              <th className="px-4 py-3 font-medium text-right">Porsi Bunga</th>
              <th className="px-4 py-3 font-medium text-right">Sisa Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
            {currentRows.length > 0 ? currentRows.map(row => (
              <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  {row.month} 
                  <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">(Thn {Math.ceil(row.month/12)})</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10">
                    {row.rate.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium dark:text-slate-200">{idr.format(row.payment)}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{idr.format(row.principalPaid)}</td>
                <td className="px-4 py-3 text-right text-rose-600/80 dark:text-rose-400/80">{idr.format(row.interest)}</td>
                <td className="px-4 py-3 text-right font-medium dark:text-slate-200">{idr.format(row.balance)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Tidak ada data amortisasi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeData.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div>
            Menampilkan {safePage * rowsPerPage + 1} - {Math.min((safePage + 1) * rowsPerPage, activeData.length)} dari {activeData.length} bulan
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={safePage === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button 
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
