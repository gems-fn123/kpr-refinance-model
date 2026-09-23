import React from 'react';
import { Landmark, RefreshCw, Moon, Sun, Share2 } from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";

export function Header({ onReset, onShare }) {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl text-white shadow-sm">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              KPR Refinance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Bandingkan KPR lama dan baru
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onShare} 
            className="flex items-center justify-center rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Share Hasil"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="flex items-center justify-center rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={onReset} 
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
