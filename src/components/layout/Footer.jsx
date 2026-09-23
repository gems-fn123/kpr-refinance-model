import React from 'react';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 print:hidden">
      <div className="mx-auto max-w-7xl px-5 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2 font-medium">© {new Date().getFullYear()} KPR Refinance Calculator</p>
        <p className="max-w-2xl mx-auto text-xs opacity-75 leading-relaxed">
          Disclaimer: Kalkulator ini hanya memberikan estimasi dan simulasi berdasarkan asumsi yang Anda masukkan. 
          Hasil perhitungan tidak mengikat dan dapat berbeda dengan perhitungan resmi dari pihak bank. 
          Selalu konsultasikan dengan pihak bank terkait sebelum mengambil keputusan finansial.
        </p>
      </div>
    </footer>
  );
}
