import React from 'react';
import { Bot, Sparkles } from "lucide-react";

export function ChatFloatingButton({ onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-30 print:hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={onClick}
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 px-4 py-3 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Bot size={18} className="text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 text-xs font-bold leading-none">
            <span>Tanya AI: Tenor Optimal</span>
            <Sparkles size={11} className="text-amber-300" />
          </div>
          <span className="text-[10px] text-indigo-100 font-medium">Berdasarkan Skema Aktif</span>
        </div>
      </button>
    </div>
  );
}
